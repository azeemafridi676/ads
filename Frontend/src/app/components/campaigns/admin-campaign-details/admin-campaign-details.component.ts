import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CampaignService } from 'src/app/shared/service/campaign/campaign.service';
import { ToastrService } from 'ngx-toastr';
import { animate, style, transition, trigger } from '@angular/animations';
import { ActivatedRoute } from '@angular/router';
import { NavService } from 'src/app/shared/service/navbar/nav.service';
import { GoogleMap } from '@angular/google-maps';
import { SocketService } from 'src/app/shared/service/socket/socket.service';
import { LoggingService } from 'src/app/shared/service/logging.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-campaign-details',
  templateUrl: './admin-campaign-details.component.html',
  styleUrls: ['./admin-campaign-details.component.scss'],
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
    ])
  ]
})
export class AdminCampaignDetailsComponent implements OnInit, OnDestroy {
  loading: boolean = false;
  searchTerm: string = '';
  selectedCampaign: any = null;
  rejectionReason: string = '';
  showRejectionModal: boolean = false;
  campaignId: string = '';
  campaign: any = null;
  campaignStats = {
    total: 0,
    pending: 0,
    active: 0,
    completed: 0,
    rejected: 0
  };
  rejectingCampaign: boolean = false;
  approvingCampaign: boolean = false;
  private readonly SOURCE = 'AdminCampaignDetailsComponent';

  // Add new properties for animation triggers
  locationUpdateCount = 0;
  recentlyUpdatedLocations: string[] = [];

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

  private socketSubscription?: Subscription;
  private campaignCycleSubscription?: Subscription;
  private subscriptionEventSubscription?: Subscription;

  constructor(
    private campaignService: CampaignService,
    private toastr: ToastrService,
    private route: ActivatedRoute,
    private navService: NavService,
    private socketService: SocketService,
    private loggingService: LoggingService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.campaignId = params['id'];
      this.getCampaignDetails();
    });
    this.navService.setTitle('Campaign Details');
    this.navService.setSubtitle(this.campaign?.campaignName);
    this.setupSocketSubscriptions();
  }

  private setupSocketSubscriptions(): void {
    // Keep existing socket connection status check
    this.socketSubscription = this.socketService.getConnectionStatus().subscribe((isConnected: boolean) => {
      
      if (isConnected) {
        // Keep existing played locations subscription
        this.socketService.getPlayedLocationsUpdatesAdmin().subscribe({
          next: (data: any) => {
            if (data.campaignId === this.campaignId) {
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
            this.loggingService.log(this.SOURCE, '❌ Error in played locations subscription:', error);
          }
        });

        // Add campaign cycle updates subscription
        this.campaignCycleSubscription = this.socketService.getCampaignCycleUpdatesAdmin().subscribe({
          next: (data: any) => {
            if (data && data.campaignId === this.campaignId) {
              
              // Update cycle count
              if (this.campaign) {
                this.campaign.runCycleCount = data.campaignCycleCount;
              }

              // If subscription is completed, update campaign status
              if (data.subscriptionCompleted && data.subscriptionId) {
                if (this.campaign && this.campaign.userId?.currentSubscription === data.subscriptionId) {
                  this.campaign.status = 'completed';
                  this.toastr.info('Campaign has been completed due to cycle limit.');
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
            
            if (data?.type === 'subscription_updated' && data?.subscription) {
              const subscription = data.subscription;

              // Check if subscription matches and has the required conditions
              if (subscription.currentCycles === 0 && !subscription.isCompleted) {
                
                if (this.campaign && 
                    this.campaign.userId?.currentSubscription === subscription._id) {
                  
                  if (this.campaign.status === 'completed') {
                    this.campaign.status = 'approved';
                    this.toastr.info('Campaign status updated to approved.');
                  } 
                } 
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

  getCampaignDetails() {
    this.loading = true;
    this.campaignService.getCampaignDetails(this.campaignId).subscribe({
      next: (response) => {
        this.campaign = response.data;
        
        // Update map bounds after loading initial data
        setTimeout(() => {
          this.updateMapBounds();
        }, 100);
        
        this.loading = false;
      },
      error: (error) => {
        this.toastr.error('Failed to load campaigns');
        this.loading = false;
      }
    });
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

  approveCampaign(campaignId: string) {
    this.approvingCampaign = true;
    this.campaignService.approveCampaign(campaignId).subscribe({
      next: () => {
        this.toastr.success('Campaign approved successfully');
        this.getCampaignDetails();
      },
      error: () => {
        this.toastr.error('Failed to approve campaign');
      },
      complete: () => {
        this.approvingCampaign = false;
      }
    });
  }

  openRejectionModal(campaign: any) {
    this.selectedCampaign = campaign;
    this.showRejectionModal = true;
  }

  rejectCampaign() {
    if (!this.rejectionReason.trim()) {
      this.toastr.error('Please provide a rejection reason');
      return;
    }

    if (!this.selectedCampaign?._id) {
      this.toastr.error('Campaign ID is missing');
      return;
    }

    this.rejectingCampaign = true;
    this.campaignService.rejectCampaign(
      this.selectedCampaign._id,
      this.rejectionReason.trim()
    ).subscribe({
      next: () => {
        this.toastr.success('Campaign rejected successfully');
        this.closeRejectionModal();
        this.getCampaignDetails();
      },
      error: (error) => {
        console.error('Rejection error:', error);
        this.toastr.error(error.message || 'Failed to reject campaign');
      },
      complete: () => {
        this.rejectingCampaign = false;
      }
    });
  }

  closeRejectionModal() {
    this.showRejectionModal = false;
    this.selectedCampaign = null;
    this.rejectionReason = '';
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  // Add helper methods for the map
  getPosition(location: any): google.maps.LatLngLiteral {
    return {
      lat: Number(location.latitude),
      lng: Number(location.longitude)
    };
  }

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