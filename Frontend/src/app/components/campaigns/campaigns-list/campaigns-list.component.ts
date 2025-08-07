import { Component, OnInit, OnDestroy } from '@angular/core';
import { CampaignService } from 'src/app/shared/service/campaign/campaign.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { NavService } from 'src/app/shared/service/navbar/nav.service';
import { SocketService } from 'src/app/shared/service/socket/socket.service';
import { Subscription as RxSubscription } from 'rxjs';
import { LoggingService } from 'src/app/shared/service/logging.service';
import { trigger, transition, style, animate, state } from '@angular/animations';

interface Campaign {
  _id: string;
  campaignName: string;
  status: string;
  mediaType: 'video' | 'image';
  mediaUrl: string;
  startDateTime: string;
  endDateTime: string;
  selectedLocations: any[];
  runCycleCount: number;
  userId: {
    _id: string;
    currentSubscription: {
      _id: string;
    };
  };
}

@Component({
  selector: 'app-campaigns-list',
  templateUrl: './campaigns-list.component.html',
  styleUrls: ['./campaigns-list.component.scss'],
  animations: [
    trigger('pulseAnimation', [
      transition('* => *', [
        style({ transform: 'scale(1)' }),
        animate('200ms ease-in', style({ transform: 'scale(1.2)' })),
        animate('200ms ease-out', style({ transform: 'scale(1)' }))
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
export class CampaignsListComponent implements OnInit, OnDestroy {
  campaigns: Campaign[] = [];
  loading: boolean = false;
  searchTerm: string = '';
  filterStatus: string = 'all';
  showDeleteModal: boolean = false;
  selectedCampaign: Campaign | null = null;
  deletingCampaignId: string | null = null;
  private socketSubscription?: RxSubscription;
  private subscriptionEventSubscription?: RxSubscription;
  private readonly SOURCE = 'campaigns-list.component.ts';

  constructor(
    private campaignService: CampaignService,
    private toastr: ToastrService,
    private router: Router,
    private navService: NavService,
    private socketService: SocketService,
    private loggingService: LoggingService
  ) {}

  ngOnInit() {
    this.loading = true;
    this.getCampaigns();
    this.navService.setTitle('Campaigns');
    this.navService.setSubtitle('Manage campaigns');
    this.setupSocketSubscription();
    this.setupSubscriptionEventSubscription();
  }

  private setupSocketSubscription(): void {
    this.socketSubscription = this.socketService.getCampaignCycleUpdates().subscribe({
      next: (data: any) => {
        if (data && data.campaignId) {
          this.loggingService.log(this.SOURCE, 'Campaign cycle update:', data);
          
          // Update cycle count for the specific campaign
          const campaignIndex = this.campaigns.findIndex(c => c._id === data.campaignId);
          if (campaignIndex !== -1) {
            // Create a new array to trigger change detection
            this.campaigns = [...this.campaigns];
            this.campaigns[campaignIndex] = {
              ...this.campaigns[campaignIndex],
              runCycleCount: data.campaignCycleCount
            };

            // If subscription is completed, update all related campaigns
            if (data.subscriptionCompleted && data.subscriptionId) {
              this.loggingService.log(this.SOURCE, 'Subscription completed, updating all related campaigns');
              
              this.campaigns = this.campaigns.map(campaign => {
                // Check if campaign belongs to the completed subscription and is not pending
                if (campaign.userId?.currentSubscription?._id === data.subscriptionId && campaign.status !== 'pending') {
                  this.loggingService.log(this.SOURCE, `Updating campaign status to completed: ${campaign.campaignName}`);
                  return {
                    ...campaign,
                    status: 'completed'
                  };
                } else {
                  this.loggingService.log(this.SOURCE, `Campaign ${campaign.campaignName} not updated - Status: ${campaign.status}, Subscription match: ${campaign.userId?.currentSubscription?._id === data.subscriptionId}`);
                }
                return campaign;
              });

              this.toastr.info('All eligible campaigns under this subscription have been completed due to cycle limit.');
            }
          }
        }
      },
      error: (error) => {
        this.loggingService.log(this.SOURCE, 'Error in campaign cycle subscription:', error);
      }
    });
  }

  private setupSubscriptionEventSubscription(): void {
    this.subscriptionEventSubscription = this.socketService.getSubscriptionEvents().subscribe({
      next: (data: any) => {
        if (data?.type === 'subscription_updated' && data?.subscription) {
          const subscription = data.subscription;
          this.loggingService.log(this.SOURCE, 'Subscription update received:', subscription);

          // Check if subscription matches and has the required conditions
          if (subscription.currentCycles === 0 && !subscription.isCompleted) {
            this.campaigns = this.campaigns.map(campaign => {
              // Check if campaign belongs to this subscription and is completed
              if (campaign.userId?.currentSubscription?._id === subscription._id && campaign.status === 'completed') {
                this.loggingService.log(this.SOURCE, `Updating campaign status to approved: ${campaign.campaignName}`);
                return {
                  ...campaign,
                  status: 'approved'
                };
              }
              return campaign;
            });
          }
        }
      },
      error: (error) => {
        this.loggingService.log(this.SOURCE, 'Error in subscription event subscription:', error);
      }
    });
  }

  ngOnDestroy() {
    if (this.socketSubscription) {
      this.socketSubscription.unsubscribe();
    }
    if (this.subscriptionEventSubscription) {
      this.subscriptionEventSubscription.unsubscribe();
    }
  }

  getCampaigns() {
    this.campaignService.getCampaigns().subscribe({
      next: (response) => {
        this.campaigns = response.data;
        this.loading = false;
      },
      error: (error) => {
        this.toastr.error('Failed to load campaigns');
        this.loading = false;
      }
    });
  }

  openDeleteModal(campaign: Campaign) {
    this.selectedCampaign = campaign;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.selectedCampaign = null;
  }

  deleteCampaign() {
    if (!this.selectedCampaign?._id) {
      this.toastr.error('Campaign ID is missing');
      return;
    }

    this.deletingCampaignId = this.selectedCampaign._id;
    this.campaignService.deleteCampaign(this.selectedCampaign._id).subscribe({
      next: () => {
        this.toastr.success('Campaign deleted successfully');
        this.closeDeleteModal();
        // Refresh both campaigns and limit check
        this.getCampaigns();
      },
      error: (error) => {
        console.error('Delete error:', error.error.message);
        this.toastr.error(error.error.message || 'Failed to delete campaign');
        this.deletingCampaignId = null;
      },
      complete: () => {
        this.deletingCampaignId = null;
      }
    });
  }

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green text-green-800',
      completed: 'bg-blue-400 text-blue-800',
      rejected: 'bg-red text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  filterCampaigns() {
    if (this.searchTerm.trim() || this.filterStatus !== 'all') {
      return this.campaigns.filter(campaign => {
        const matchesSearch = campaign.campaignName.toLowerCase().includes(this.searchTerm.toLowerCase());
        const matchesStatus = this.filterStatus === 'all' || campaign.status === this.filterStatus;
        return matchesSearch && matchesStatus;
      });
    }
    return this.campaigns;
  }

  handleCreateCampaign() {
    this.router.navigate(['/dashboard/create-campaign']);
  }
}
