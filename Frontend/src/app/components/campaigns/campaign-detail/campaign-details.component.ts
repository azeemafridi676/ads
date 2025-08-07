import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CampaignService } from '../../../shared/service/campaign/campaign.service';
import { animate, style, transition, trigger } from '@angular/animations';
import { NavService } from 'src/app/shared/service/navbar/nav.service';
import { GoogleMap, MapMarker } from '@angular/google-maps';
import { environment } from 'src/environments/environment';
import { SocketService } from 'src/app/shared/service/socket/socket.service';
import { LoggingService } from 'src/app/shared/service/logging.service';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-campaign-details',
  templateUrl: './campaign-details.component.html',
  styleUrls: ['./campaign-details.component.scss'],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.3s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('markerAnimation', [
      transition(':enter', [
        style({ transform: 'scale(0)', opacity: 0 }),
        animate('0.5s cubic-bezier(0.34, 1.56, 0.64, 1)', 
          style({ transform: 'scale(1)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('0.3s ease-out', 
          style({ transform: 'scale(0)', opacity: 0 }))
      ])
    ]),
    trigger('pulseAnimation', [
      transition(':increment', [
        style({ transform: 'scale(1)' }),
        animate('0.3s ease-in-out', style({ transform: 'scale(1.2)' })),
        animate('0.3s ease-in-out', style({ transform: 'scale(1)' }))
      ])
    ]),
    trigger('statusChange', [
      transition('* => *', [
        style({ transform: 'scale(0.8)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'scale(1)', opacity: 1 }))
      ])
    ])
  ]
})
export class CampaignDetailsComponent implements OnInit, OnDestroy {
  campaign: any;
  loading: boolean = true;
  private readonly SOURCE = 'CampaignDetailsComponent';
  private socketSubscription?: Subscription;
  private campaignCycleSubscription?: Subscription;
  private subscriptionEventSubscription?: Subscription;

  @ViewChild(GoogleMap) map!: GoogleMap;
  
  // Google Maps properties
  center: google.maps.LatLngLiteral = { lat: 39.8283, lng: -98.5795 }; // Center of USA
  zoom = 4;
  bounds: google.maps.LatLngBounds | null = null;
  selectedLocationMarkerOptions: google.maps.MarkerOptions = {
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: '#eb7641',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
    }
  };
  playedLocationMarkerOptions: google.maps.MarkerOptions = {
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 6,
      fillColor: '#000000',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
    }
  };
  mapOptions: google.maps.MapOptions = {
    styles: [
      {
        featureType: 'all',
        elementType: 'all',
        stylers: [{ saturation: -20 }]
      }
    ]
  };

  // Add new properties for animation triggers
  locationUpdateCount = 0;
  recentlyUpdatedLocations: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private campaignService: CampaignService,
    private navService: NavService,
    private socketService: SocketService,
    private loggingService: LoggingService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.navService.setTitle('Campaign Details');
    
    // Get campaign ID first
    const campaignId = this.route.snapshot.paramMap.get('id');
    if (!campaignId) {
        this.loggingService.log(this.SOURCE, '❌ No campaign ID provided');
        return;
    }

    // Setup socket subscription before loading campaign
    this.setupSocketSubscription(campaignId);
    
    // Then load campaign details
    this.loadCampaignDetails(campaignId);
  }

  private setupSocketSubscription(campaignId: string): void {
    this.socketSubscription = this.socketService.getConnectionStatus().subscribe((isConnected: boolean) => {
        this.loggingService.log(this.SOURCE, `Socket connection status: ${isConnected}`);
        
        if (isConnected) {
            // Keep existing played locations subscription
            this.socketService.getPlayedLocationsUpdates().subscribe({
                next: (data: any) => {
                    if (data.campaignId === campaignId) {
                        if (!this.campaign.playedLocations) {
                            this.campaign.playedLocations = [];
                        }
                        this.campaign.playedLocations.push(data.playedLocations);
                        this.locationUpdateCount++;
                        this.recentlyUpdatedLocations = [`${data.playedLocations.latitude},${data.playedLocations.longitude}`];
                        this.updateMapBounds();
                        setTimeout(() => {
                            this.recentlyUpdatedLocations = [];
                        }, 3000);
                    }
                },
                error: (error) => {
                    this.loggingService.log(this.SOURCE, 'Error in played locations subscription:', error);
                }
            });

            // Add campaign cycle updates subscription
            this.campaignCycleSubscription = this.socketService.getCampaignCycleUpdates().subscribe({
                next: (data: any) => {
                    if (data && data.campaignId === campaignId) {
                        // Update cycle count
                        if (this.campaign) {
                            this.campaign.runCycleCount = data.campaignCycleCount;
                        }

                        // If subscription is completed, update campaign status
                        if (data.subscriptionCompleted && data.subscriptionId) {
                            this.loggingService.log(this.SOURCE, `Subscription completed event received for subscription: ${data.subscriptionId}`);
                            if (this.campaign && this.campaign.userId?.currentSubscription === data.subscriptionId) {
                                this.loggingService.log(this.SOURCE, `Updating campaign status to completed for campaign: ${this.campaign.campaignName}`);
                                this.campaign.status = 'completed';
                                this.toastr.info('Campaign has been completed due to cycle limit.');
                            } else {
                                this.loggingService.log(this.SOURCE, `Campaign or subscription ID mismatch. Campaign subscription: ${this.campaign?.userId?.currentSubscription}, Event subscription: ${data.subscriptionId}`);
                                this.loggingService.log(this.SOURCE, `Whole campaign object: ${JSON.stringify(this.campaign)}`);
                            }
                        }
                    }
                },
                error: (error) => {
                    this.loggingService.log(this.SOURCE, 'Error in campaign cycle subscription:', error);
                }
            });

            // Add subscription event updates
            this.subscriptionEventSubscription = this.socketService.getSubscriptionEvents().subscribe({
                next: (data: any) => {
                    this.loggingService.log(this.SOURCE, 'Subscription event received:', data);
                    
                    // Check for completion event
                    if (data?.type === 'completion' && data?.subscriptionId) {
                        this.loggingService.log(this.SOURCE, `Processing subscription completion event for subscription: ${data.subscriptionId}`);
                        
                        if (this.campaign && this.campaign.userId?.currentSubscription === data.subscriptionId) {
                            this.loggingService.log(this.SOURCE, `Campaign subscription matches. Current status: ${this.campaign.status}`);
                            
                            if (this.campaign.status === 'completed') {
                                this.loggingService.log(this.SOURCE, `Updating campaign status from completed to approved: ${this.campaign.campaignName}`);
                                this.campaign.status = 'approved';
                                this.toastr.info('Campaign status updated to approved.');
                            } else {
                                this.loggingService.log(this.SOURCE, `Campaign status is not completed (${this.campaign.status}), skipping status update`);
                            }
                        } else {
                            this.loggingService.log(this.SOURCE, `Campaign or subscription ID mismatch. Campaign subscription: ${this.campaign?.userId?.currentSubscription}, Event subscription: ${data.subscriptionId}`);
                            this.loggingService.log(this.SOURCE, `Whole campaign object: ${JSON.stringify(this.campaign)}`);
                        }
                    }
                },
                error: (error) => {
                    this.loggingService.log(this.SOURCE, 'Error in subscription event subscription:', error);
                }
            });
        }
    });
  }

  ngOnDestroy() {
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
    }
    if (this.campaignCycleSubscription) {
      this.campaignCycleSubscription.unsubscribe();
    }
    if (this.subscriptionEventSubscription) {
      this.subscriptionEventSubscription.unsubscribe();
    }
  }

  private updateMapBounds(): void {
    if (!this.map) return;

    const bounds = new google.maps.LatLngBounds();
    
    // Add selected locations to bounds
    this.campaign.selectedLocations?.forEach((location: any) => {
      bounds.extend({
        lat: Number(location.latitude),
        lng: Number(location.longitude)
      });
    });

    // Add played locations to bounds
    this.campaign.playedLocations?.forEach((location: any) => {
      bounds.extend({
        lat: Number(location.latitude),
        lng: Number(location.longitude)
      });
    });

    // Only update if we have locations
    if (this.campaign.selectedLocations?.length || this.campaign.playedLocations?.length) {
      this.bounds = bounds;
      this.map.fitBounds(this.bounds);
      
      // If there's only one location, set an appropriate zoom level
      if (this.campaign.selectedLocations?.length + this.campaign.playedLocations?.length === 1) {
        this.map.zoom = 12;
      }
    }
  }

  private loadCampaignDetails(campaignId: string): void {
    this.loading = true;
    this.campaignService.getCampaignById(campaignId).subscribe({
      next: (response: any) => {
        this.campaign = response.data;
        
        // Update map bounds after loading initial data
        setTimeout(() => {
          this.updateMapBounds();
        }, 100);
        
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading campaign:', error);
        this.loading = false;
      }
    });
  }

  // Add this method to handle coordinate parsing
  getPosition(location: any): google.maps.LatLngLiteral {
    return {
      lat: Number(location.latitude),
      lng: Number(location.longitude)
    };
  }

  // Helper method to format the played date
  formatPlayedAt(playedAt: string): string {
    return new Date(playedAt).toLocaleString();
  }

  // Add helper method to check if a location was recently updated
  isRecentlyUpdated(location: any): boolean {
    return this.recentlyUpdatedLocations.includes(`${location.latitude},${location.longitude}`);
  }

  // Add new method to get marker options
  getPlayedLocationMarkerOptions(location: any): google.maps.MarkerOptions {
    if (this.isRecentlyUpdated(location)) {
      return {
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#4CAF50',
          fillOpacity: 1,
          strokeColor: '#45a049',
          strokeWeight: 3,
        }
      };
    }
    return this.playedLocationMarkerOptions;
  }
}