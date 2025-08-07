import { Component, OnInit, OnDestroy } from '@angular/core';
import { CampaignService } from 'src/app/shared/service/campaign/campaign.service';
import { ToastrService } from 'ngx-toastr';
import { animate, style, transition, trigger, state } from '@angular/animations';
import { NavService } from 'src/app/shared/service/navbar/nav.service';
import { LoggingService } from 'src/app/shared/service/logging.service';
import { SocketService } from 'src/app/shared/service/socket/socket.service';
import { Subscription as RxSubscription } from 'rxjs';

interface CampaignStats {
  total: number;
  pending: number;
  approved: number;
  completed: number;
  rejected: number;
}

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
    firstName: string;
    lastName: string;
    _id: string;
    currentSubscription: {
      _id: string;
    };
  };
}

@Component({
  selector: 'app-customer-campaigns',
  templateUrl: './customer-campaigns.component.html',
  styleUrls: ['./customer-campaigns.component.scss'],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.3s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
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
export class CustomerCampaignsComponent implements OnInit, OnDestroy {
  campaigns: Campaign[] = [];
  allCampaigns: Campaign[] = [];
  loading: boolean = false;
  searchTerm: string = '';
  filterStatus: string = 'all';
  selectedCampaign: Campaign | null = null;
  showRejectionModal: boolean = false;
  showDeleteModal: boolean = false;
  rejectionReason: string = '';
  campaignStats: CampaignStats = {
    total: 0,
    pending: 0,
    approved: 0,
    completed: 0,
    rejected: 0
  };
  approvingCampaignId: string | null = null;
  rejectingCampaign: boolean = false;
  private readonly SOURCE = 'CustomerCampaignsComponent';
  private socketSubscription?: RxSubscription;
  private subscriptionEventSubscription?: RxSubscription;
  deletingCampaignId: string | null = null;

  constructor(
    private campaignService: CampaignService,
    private toastr: ToastrService,
    private navService: NavService,
    private loggingService: LoggingService,
    private socketService: SocketService
  ) {}

  ngOnInit() {
    this.getAllCampaigns();
    this.navService.setTitle('Campaign Review');
    this.navService.setSubtitle('Review and manage customer campaign submissions');
    this.setupSocketSubscription();
    this.setupSubscriptionEventSubscription();
  }

  private setupSocketSubscription(): void {
    this.socketSubscription = this.socketService.getCampaignCycleUpdatesAdmin().subscribe({
      next: (data: any) => {
        if (data && data.campaignId) {
          this.loggingService.log(this.SOURCE, 'Campaign cycle update:', data);
          
          // Update cycle count for the specific campaign
          const campaignIndex = this.allCampaigns.findIndex(c => c._id === data.campaignId);
          if (campaignIndex !== -1) {
            // Create a new array to trigger change detection
            this.allCampaigns = [...this.allCampaigns];
            this.allCampaigns[campaignIndex] = {
              ...this.allCampaigns[campaignIndex],
              runCycleCount: data.campaignCycleCount
            };

            // If subscription is completed, update all related campaigns
            if (data.subscriptionCompleted && data.subscriptionId) {
              this.loggingService.log(this.SOURCE, 'Subscription completed, updating all related campaigns');
              
              this.allCampaigns = this.allCampaigns.map(campaign => {
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
              this.updateCampaignStats();
            }

            this.filterCampaigns();
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
            this.allCampaigns = this.allCampaigns.map(campaign => {
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
            
            // Update the filtered campaigns and stats
            this.filterCampaigns();
            this.updateCampaignStats();
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

  getAllCampaigns() {
    this.loading = true;
    this.campaignService.getCampaignsToReview('all').subscribe({
      next: (response) => {
        this.allCampaigns = response.data;
        this.updateCampaignStats();
        this.filterCampaigns();
        this.loading = false;
      },
      error: (error) => {
        this.toastr.error('Failed to load campaigns');
        this.loading = false;
      }
    });
  }

  getCampaigns() {
    this.filterCampaigns();
  }

  filterCampaigns() {
    if (this.filterStatus === 'all') {
      this.campaigns = [...this.allCampaigns];
    } else {
      this.campaigns = this.allCampaigns.filter(campaign => campaign.status === this.filterStatus);
    }
  }

  updateCampaignStats() {
    this.campaignStats = {
      total: this.allCampaigns.length,
      pending: this.allCampaigns.filter(c => c.status === 'pending').length,
      approved: this.allCampaigns.filter(c => c.status === 'approved').length,
      completed: this.allCampaigns.filter(c => c.status === 'completed').length,
      rejected: this.allCampaigns.filter(c => c.status === 'rejected').length
    };
  }

  approveCampaign(campaignId: string) {
    this.approvingCampaignId = campaignId;
    this.campaignService.approveCampaign(campaignId).subscribe({
      next: () => {
        this.toastr.success('Campaign approved successfully');
        this.getAllCampaigns();
      },
      error: () => {
        this.toastr.error('Failed to approve campaign');
      },
      complete: () => {
        this.approvingCampaignId = null;
      }
    });
  }

  openRejectionModal(campaign: Campaign) {
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
        this.getAllCampaigns();
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
      approved: 'bg-green text-green-800',
      completed: 'bg-blue-400 text-blue-800',
      rejected: 'bg-red text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  refreshCampaigns() {
    this.loading = true;
    this.getAllCampaigns();
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
        this.getAllCampaigns();
        this.deletingCampaignId = null;
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
}