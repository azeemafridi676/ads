import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Campaign } from '../shared/interfaces';
import { CampaignService } from '../shared/services/campaigns/campaign.service';
import { ElectronService } from '../shared/services/electron/electron.service';
import { HttpClient } from '@angular/common/http';
import { LoggingService } from '../shared/services/logging.service';
import { NavbarComponent } from '../shared/components/navbar/navbar.component';

interface DownloadStatus {
  [key: string]: {
    status: 'pending' | 'downloading' | 'completed' | 'error';
    progress: number;
    error?: string;
  };
}

@Component({
  selector: 'app-download-status-page',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './download-status-page.component.html',
  styleUrls: ['./download-status-page.component.css']
})
export class DownloadStatusPageComponent implements OnInit {
  selectedCampaigns: Campaign[] = [];
  downloadStatus: DownloadStatus = {};
  allDownloadsComplete: boolean = false;
  showControls = false;
  hideTimeout: any;
  private readonly SOURCE_FILE = 'download-status-page.component.ts';
  showBackButton = true;
  copiedPath: string | null = null;
  showCopyFeedback: {[key: string]: boolean} = {};

  constructor(
    private campaignService: CampaignService,
    private electronService: ElectronService,
    private ngZone: NgZone,
    private http: HttpClient,
    private router: Router,
    private loggingService: LoggingService
  ) {}

  ngOnInit() {
    this.selectedCampaigns = this.campaignService.getSelectedCampaigns();
    if (this.selectedCampaigns.length > 0) {
      this.selectedCampaigns.forEach(campaign => {
        this.downloadStatus[campaign._id] = {
          status: 'pending',
          progress: 0
        };
      });
      this.initializeDownloads();
    }

    this.electronService.onDownloadProgress().subscribe(
      (progress: { id: string, progress: number }) => {
        this.ngZone.run(() => {
          if (this.downloadStatus[progress.id]) {
            this.downloadStatus[progress.id].progress = progress.progress;
            this.downloadStatus[progress.id].status = 'downloading';
          }
          this.checkAllDownloadsComplete();
        });
      },
      (error) => {
      }
    );

    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
  }

  ngOnDestroy() {
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
  }

  async initializeDownloads() {
    for (const campaign of this.selectedCampaigns) {
      if (campaign.isDownloaded && campaign.downloadedUrl) {
        const fileExists = await this.electronService.checkFileExists(campaign.downloadedUrl);
        if (!fileExists) {
          campaign.isDownloaded = false;
          campaign.downloadedUrl = undefined;
        }
      }
      
      this.downloadStatus[campaign._id] = {
        progress: 0,
        status: (campaign.isDownloaded && campaign.downloadedUrl) ? 'completed' : 'pending'
      };
    }
    await this.startDownloads();
    this.checkAllDownloadsComplete();
  }

  async startDownloads() {
    for (const campaign of this.selectedCampaigns) {
      
      if (this.downloadStatus[campaign._id].status === 'pending') {
        await this.downloadFile(campaign);
      }
    }
  }

  async downloadFile(campaign: Campaign) {
    // First check if campaign is already downloaded
    if (campaign.isDownloaded && campaign.downloadedUrl) {
        try {
            // Ensure we're using the correct path
            const downloadPath = campaign.downloadedUrl;
            const fileExists = await this.electronService.checkFileExists(downloadPath);
            if (fileExists) {
                this.downloadStatus[campaign._id].status = 'completed';
                this.downloadStatus[campaign._id].progress = 100;
                return;
            } else {
                // Reset download status since file is missing
                campaign.isDownloaded = false;
                campaign.downloadedUrl = undefined;
                // Continue with download
            }
        } catch (error) {
            campaign.isDownloaded = false;
            campaign.downloadedUrl = undefined;
        }
    }

    const fileType = this.getFileType(campaign.mediaUrl);
    const fileExtension = this.getFileExtension(campaign.mediaUrl);
    const fileName = `campaign_${campaign._id}_${campaign.campaignName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${fileType}.${fileExtension}`;
    
    try {
        this.downloadStatus[campaign._id].status = 'downloading';
        const mediaType = fileType;
        const result = await this.electronService.downloadFile(
            campaign._id, 
            campaign.mediaUrl,
            mediaType
        );
        
        if (result.success && result.path) {
            // Update campaign in database with download status
            try {
                await this.campaignService.updateCampaignDownloadStatus(campaign._id, result.path);
            } catch (error) {
            }
            
            await this.updateCampaignDownloadPath(campaign._id, result.path);
            this.downloadStatus[campaign._id].status = 'completed';
            this.downloadStatus[campaign._id].progress = 100;
        } else {
            throw new Error(result.error || 'Download failed');
        }
    } catch (error) {
        this.downloadStatus[campaign._id].status = 'error';
        this.downloadStatus[campaign._id].error = this.getErrorMessage(error);
    }
  }

  private getFileType(url: string): string {
    const extension = this.getFileExtension(url).toLowerCase();
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi'];
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    if (videoExtensions.includes(extension)) {
      return 'video';
    } else if (imageExtensions.includes(extension)) {
      return 'image';
    } else {
      return 'unknown';
    }
  }

  private getFileExtension(url: string): string {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname;
    const extension = pathname.split('.').pop() || '';
    return extension.toLowerCase();
  }

  getErrorMessage(error: any): string {
    if (error.message.includes('ENOTFOUND')) {
      return 'Network error: Unable to connect to the server. Please check your internet connection.';
    } else if (error.message.includes('ETIMEDOUT')) {
      return 'Connection timed out. The server is taking too long to respond.';
    } else if (error.message.includes('403')) {
      return 'Access forbidden. You may not have permission to download this file.';
    } else if (error.message.includes('404')) {
      return 'File not found. The video may have been moved or deleted.';
    } else if (error.message.includes('ECONNREFUSED')) {
      return 'Connection refused. This could be due to a firewall or antivirus blocking the connection.';
    } else {
      return `An unexpected error occurred: ${error.message}`;
    }
  }

  async updateCampaignDownloadPath(campaignId: string, downloadPath: string) {
    try {
      const campaignIndex = this.selectedCampaigns.findIndex(c => c._id === campaignId);
      if (campaignIndex !== -1) {
        this.selectedCampaigns[campaignIndex].downloadedUrl = downloadPath;
        this.selectedCampaigns[campaignIndex].isDownloaded = true;
      }
    } catch (error) {
      this.loggingService.log(this.SOURCE_FILE, 'Error updating campaign download path:', error);
    }
  }

  checkAllDownloadsComplete() {
    this.allDownloadsComplete = Object.values(this.downloadStatus).every(
      status => status.status === 'completed'
    );
    if (this.allDownloadsComplete) {
      this.updateDownloadedCampaigns();
    }
  }

  async retryDownload(campaign: Campaign) {
    if (this.downloadStatus[campaign._id] && this.downloadStatus[campaign._id].status === 'error') {
      this.downloadStatus[campaign._id] = { progress: 0, status: 'pending' };
      await this.downloadFile(campaign);
      this.checkAllDownloadsComplete();
    }
  }

  async retryAllFailed() {
    const failedCampaigns = this.selectedCampaigns.filter(
      campaign => this.downloadStatus[campaign._id].status === 'error'
    );
    for (const campaign of failedCampaigns) {
      await this.retryDownload(campaign);
    }
  }

  private updateDownloadedCampaigns() {
    const downloadedCampaigns = this.selectedCampaigns.filter(campaign => 
      this.downloadStatus[campaign._id].status === 'completed'
    );
    console.log("compaigns are going to be set", downloadedCampaigns);
    this.campaignService.setDownloadedCampaigns(downloadedCampaigns);
  }

  goToMapPreviewPage() {
    if (this.allDownloadsComplete) {
      const playableCampaigns = this.campaignService.getPlayableCampaigns();
      if (playableCampaigns.length > 0) {
        this.router.navigate(['/app/map-preview']);
      } else {
        const allCampaigns = this.campaignService.getDownloadedCampaigns();
        if (allCampaigns.length > 0) {
          this.router.navigate(['/app/map-preview']);
        } else {
          alert('No campaigns are available to view.');
        }
      }
    }
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

  private generateFileName(campaign: Campaign, fileType: string): string {
    const fileExtension = fileType === 'video' ? 'mp4' : 'jpg';
    const fileName = `campaign_${campaign._id}_${campaign.campaignName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${fileType}.${fileExtension}`;
    return fileName;
  }

  private async downloadCampaign(campaign: Campaign, index: number): Promise<void> {
    try {
      const fileType = campaign.mediaType;
      const fileName = this.generateFileName(campaign, fileType);
      
      // Use electron IPC to get download path
      const downloadPath = await this.electronService.getFilePath(fileName);

      this.updateProgress(index, 0, 'Downloading...');

      const response = await this.electronService.downloadFile(
        campaign._id,
        campaign.mediaUrl,
        campaign.mediaType
      );

      if (response.success) {
        this.selectedCampaigns[index].downloadedUrl = response.path;
        this.updateProgress(index, 100, 'Download Complete');

        await this.campaignService.updateCampaignDownloadStatus(
          campaign._id,
          response.path || ''
        );
      } else {
        this.updateProgress(index, 0, `Error: ${response.error}`);
      }
    } catch (error) {
      this.loggingService.log(
        this.SOURCE_FILE,
        'Error downloading campaign:',
        error
      );
      this.updateProgress(index, 0, 'Download Failed');
    }
  }

  private updateProgress(index: number, progress: number, message: string) {
    const campaign = this.selectedCampaigns[index];
    if (campaign) {
      this.downloadStatus[campaign._id] = {
        status: progress === 100 ? 'completed' : progress === 0 ? 'pending' : 'downloading',
        progress: progress,
        error: message.includes('Error') ? message : undefined
      };
    }
  }

  copyToClipboard(text: string) {
    if (!text || text === 'Not downloaded yet') return;
    
    navigator.clipboard.writeText(text).then(() => {
      this.showCopyFeedback[text] = true;
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        this.ngZone.run(() => {
          this.showCopyFeedback[text] = false;
        });
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  }
}
