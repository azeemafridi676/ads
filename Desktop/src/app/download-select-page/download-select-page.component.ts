import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Campaign } from '../shared/interfaces';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { CampaignService } from '../shared/services/campaigns/campaign.service';
import { ElectronService } from '../shared/services/electron/electron.service';
import { LoggingService } from '../shared/services/logging.service';
import { NavbarComponent } from '../shared/components/navbar/navbar.component';
import { SocketService } from '../shared/services/driverSocket/driver.socket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-download-select-page',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './download-select-page.component.html',
  styleUrls: ['./download-select-page.component.css']
})
export class DownloadSelectPageComponent implements OnInit, OnDestroy {
  campaigns: Campaign[] = [];
  selectedCampaigns: string[] = [];
  selectAll: boolean = true;
  showControls = false;
  hideTimeout: any;
  private readonly SOURCE_FILE = 'download-select-page.component.ts';
  objectKeys = Object.keys;
  showBackButton = true;
  private campaignSubscription: Subscription | null = null;
  isLoading: boolean = false;
  errorMessage: string | null = null;
  
  constructor(
    private http: HttpClient,
    private router: Router,
    private campaignService: CampaignService,
    private electronService: ElectronService,
    private loggingService: LoggingService,
    private socketService: SocketService
  ) {}

  ngOnInit() {
    this.getCampaigns();
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));

    // Subscribe to new campaign events
    this.campaignSubscription = this.socketService.getNewCampaigns().subscribe({
      next: (campaign) => {
        if (campaign && campaign._id && campaign.campaignName) {
          // Clear any existing error message when we receive a new campaign
          this.errorMessage = null;

          // Add the new campaign to the list if it doesn't exist
          if (!this.campaigns.some(c => c._id === campaign._id)) {
            // Ensure campaign has all required properties
            const formattedCampaign = {
              ...campaign,
              isDownloaded: false,
              downloadedUrl: undefined,
              runCycleCount: campaign.runCycleCount || 0,
              mediaDuration: campaign.mediaDuration || 0
            };

            this.campaigns = [...this.campaigns, formattedCampaign];
            // Auto-select the new campaign
            this.selectedCampaigns = [...this.selectedCampaigns, campaign._id];
            this.updateSelectAllState();
          }
        } else {
        }
      },
      error: (error) => {
        this.loggingService.log(
          this.SOURCE_FILE,
          'Error receiving campaign via socket:',
          error
        );
      }
    });
  }

  ngOnDestroy() {
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    if (this.campaignSubscription) {
      this.campaignSubscription.unsubscribe();
    }
  }

  getCampaigns() {
    this.isLoading = true;
   
    this.campaignService.getCampaigns()
      .subscribe({
        next: (campaigns: Campaign[]) => {
          
          this.campaigns = campaigns;
          this.selectedCampaigns = this.campaigns.map(c => c._id);
          this.errorMessage = null;
          this.isLoading = false;
        },
        error: (error: any) => {
          this.loggingService.log(
            this.SOURCE_FILE,
            'Error fetching campaigns:',
            error
          );
          this.campaigns = [];
          if (error.error.message) {
            this.errorMessage = error.error.message;
          } else {
            this.errorMessage = error.message || 'Failed to fetch campaigns';
          }
          this.isLoading = false;
        }
      });
  }

  
  toggleCampaign(id: string) {
    const index = this.selectedCampaigns.indexOf(id);
    if (index > -1) {
      this.selectedCampaigns = this.selectedCampaigns.filter(campaignId => campaignId !== id);
    } else {
      this.selectedCampaigns = [...this.selectedCampaigns, id];
    }
    this.updateSelectAllState();
  }

  toggleSelectAll() {
    this.selectAll = !this.selectAll;
    this.selectedCampaigns = this.selectAll ? this.campaigns.map((c: any) => c._id) : [];
  }

  updateSelectAllState() {
    this.selectAll = this.selectedCampaigns.length === this.campaigns.length;
  }

  downloadSelected() {
    if (this.selectedCampaigns.length === 0) {
      alert('Please select at least one campaign to download.');
      return;
    }
    
    const selectedCampaignData = this.campaigns.filter(campaign => 
      this.selectedCampaigns.includes(campaign._id)
    );
    
    this.campaignService.setSelectedCampaigns(selectedCampaignData);
    this.router.navigate(['/app/download-status']);
  }

  handleMouseMove(event: MouseEvent) {
    if (event.clientY < 50 && event.clientX > window.innerWidth - 100) {
      this.showControls = true;
      clearTimeout(this.hideTimeout);
      this.hideTimeout = setTimeout(() => {
        this.showControls = false;
      }, 5000);
    }
  }

  closeWindow() {
    this.electronService.closeWindow();
  }

  minimizeWindow() {
    this.electronService.minimizeWindow();
  }
}
