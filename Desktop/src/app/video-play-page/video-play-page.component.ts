import { Component, OnInit, OnDestroy, ViewChild, NgZone } from '@angular/core';
import { SocketService } from '../shared/services/driverSocket/driver.socket.service';
import { CommonModule } from '@angular/common';
import { VideoPlayerComponent } from '../shared/components/video-player/video-player.component';
import { LoggingService } from '../shared/services/logging.service';
import { CampaignService } from '../shared/services/campaigns/campaign.service';
import { firstValueFrom } from 'rxjs';
import { ElectronService } from '../shared/services/electron/electron.service';
import { Subscription } from 'rxjs';
import { Campaign } from "../shared/interfaces";
import { NavbarComponent } from '../shared/components/navbar/navbar.component';
import { AuthService } from '../shared/services/Auth/Auth.service';
import moment from 'moment-timezone';
import { environment } from '../../environments/environment';
import { GoogleMapsModule, GoogleMap } from '@angular/google-maps';
import { HttpClient } from '@angular/common/http';

interface DownloadQueueItem {
  _id: string;
  campaignName: string;
  mediaType: string;
  mediaUrl: string;
  status: 'pending' | 'downloading' | 'completed' | 'error';
  downloadedUrl?: string | null;
  error?: string;
  progress?: number;
  runCycleCount: number;
  maxRunCycleLimit: number;
}

interface MediaItem {
  path: string;
  type: 'video' | 'image';
  duration?: number;
}

interface MediaInfo {
  _id: string;
  mediaType: string;
  downloadedUrl: string;
  mediaDuration: number;
  // ... other properties
}

interface QueueItem {
  _id: string;
  campaignName: string;
  mediaType: string;
  downloadedUrl: string;
  isPlaying: boolean;
  mediaDuration: number;
  runCycleCount: number;
  maxRunCycleLimit: number;
  hasPlaybackError?: boolean;
  userId?: {
    currentSubscription?: {
      _id: string;
      runCycleLimit: number;
      currentCycles: number;
      isCompleted: boolean;
    }
  }
}

@Component({
  selector: 'app-video-play-page',
  standalone: true,
  imports: [CommonModule, VideoPlayerComponent, NavbarComponent, GoogleMapsModule],
  template: `
    <div class="main-container">
      <!-- Left Side (Video/Map Area) -->
      <div class="left-section">
        <!-- Top Navigation Area -->
        <div class="nav-section">
          <button class="nav-button" (click)="goBack()">
            <i class="ri-arrow-left-line"></i>
            Back
          </button>
          <button class="view-toggle-button" (click)="toggleView()">
            <i [class]="showMap ? 'ri-video-line' : 'ri-map-pin-line'"></i>
            {{ showMap ? 'Show Video' : 'Show Map' }}
          </button>
        </div>

        <!-- Video/Map Container -->
        <div class="content-section">
          <!-- Video Section -->
          <div class="video-section" [class.hidden]="showMap">
            <div class="video-wrapper">
              <div class="location-update-container" [class.active]="showLocationUpdate">
                <div class="location-update-indicator"></div>
                <span class="location-update-text">Location Update</span>
              </div>

              <ng-container *ngIf="currentMedia?.type === 'video'">
                <app-video-player 
                  #videoPlayer
                  [videoPath]="currentMedia?.path || ''"
                  [hasPrevious]="currentQueueIndex > 0"
                  [hasNext]="currentQueueIndex < playQueue.length - 1"
                  (videoEnded)="onMediaEnded()"
                  (videoError)="handleVideoError($event)"
                  (previousClicked)="playPrevious()"
                  (nextClicked)="playNext()">
                </app-video-player>
              </ng-container>

              <ng-container *ngIf="currentMedia?.type === 'image'">
                <div class="image-container">
                  <img [src]="currentMedia?.path"
                       alt="Campaign Image"
                       class="campaign-image"
                       (load)="onImageLoaded()"
                       (error)="onImageError($event)">
                  <div class="image-countdown" *ngIf="remainingTime > 0">
                    {{ formatTime(remainingTime) }}
                  </div>
                </div>
              </ng-container>

              <div *ngIf="!currentMedia" class="no-media" id="no-media">
                {{ noMediaMessage }}
              </div>
            </div>
          </div>

          <!-- Map Section -->
          <div class="map-section" [class.hidden]="!showMap">
            <google-map 
              *ngIf="isGoogleMapsLoaded" 
              #googleMap
              [options]="mapOptions" 
              width="100%" 
              height="100%">
            </google-map>
            <div *ngIf="!isGoogleMapsLoaded" class="loading-map">
              Loading map...
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side (Controls & Playlist) -->
      <div class="right-section">
        <!-- Window Controls -->
        <div class="window-controls">
          <button class="control-button" (click)="minimizeWindow()">
            <i class="ri-subtract-line"></i>
          </button>
          <button class="control-button close-button" (click)="closeWindow()">
            <i class="ri-close-line"></i>
          </button>
        </div>

        <!-- Download Queue Section -->
        <div class="download-section" *ngIf="downloadQueue.length > 0">
          <div class="section-header">Downloads</div>
          <div class="download-items">
            <div *ngFor="let item of downloadQueue" class="download-item">
              <div class="download-info">
                <div class="item-header">
                  <div class="item-title-group">
                    <span class="item-title">{{ item.campaignName }}</span>
                    <span class="cycle-count">Cycles: {{ item.runCycleCount }}/{{ item.maxRunCycleLimit }}</span>
                  </div>
                  <span class="item-type">{{ item.mediaType }}</span>
                </div>
                
                <!-- Progress Bar and Status -->
                <ng-container [ngSwitch]="item.status">
                  <!-- Pending Status -->
                  <div *ngSwitchCase="'pending'" class="status-indicator pending">
                    <i class="ri-time-line"></i>
                    <span>Waiting to download...</span>
                  </div>
                  
                  <!-- Downloading Status -->
                  <div *ngSwitchCase="'downloading'" class="progress-container">
                    <div class="progress-bar-wrapper">
                      <div class="progress-bar" [style.width.%]="item.progress || 0"></div>
                    </div>
                    <span class="progress-text">{{ item.progress || 0 }}%</span>
                  </div>
                  
                  <!-- Completed Status -->
                  <div *ngSwitchCase="'completed'" class="status-indicator completed">
                    <i class="ri-checkbox-circle-line"></i>
                    <span>Download complete</span>
                  </div>
                  
                  <!-- Error Status -->
                  <div *ngSwitchCase="'error'" class="status-indicator error">
                    <i class="ri-error-warning-line"></i>
                    <span>{{ item.error || 'Download failed' }}</span>
                    <button class="retry-button" (click)="retryDownload(item)">
                      <i class="ri-refresh-line"></i>
                      Retry
                    </button>
                  </div>
                </ng-container>
              </div>
            </div>
          </div>
        </div>

        <!-- Playlist Area -->
        <div class="playlist-section">
          <div class="playlist-header">Current Location Playlist</div>
          <div class="playlist-items">
            <ng-container *ngIf="playQueue.length > 0; else noMedia">
              <div *ngFor="let item of playQueue; let i = index"
                   class="playlist-item"
                   [class.active]="i === currentQueueIndex"
                   [class.has-error]="item.hasPlaybackError"
                   (click)="playQueueItem(i)">
                <div class="item-info">
                  <div class="item-title-group">
                    <span class="item-title">{{ item.campaignName }}</span>
                    <span class="cycle-count">Cycles: {{ item.runCycleCount }}/{{ item.maxRunCycleLimit }}</span>
                    <span *ngIf="item.hasPlaybackError" class="error-badge">
                      <i class="ri-error-warning-line"></i>
                      Video has playback issues
                    </span>
                    <span *ngIf="getWarningState(item).show" class="warning-badge">
                      <i class="ri-alert-line"></i>
                      Subscription ending soon - {{ getWarningState(item).remainingCycles }} cycles left
                    </span>
                  </div>
                  <span class="item-type">{{ item.mediaType }}</span>
                </div>
                <div class="item-status" *ngIf="i === currentQueueIndex">
                  Playing
                </div>
              </div>
            </ng-container>
            <ng-template #noMedia>
              <div class="no-media-message">
                No media available in current location. Please:
                <ul style="list-style-type: disc;">
                  <li>Move to a valid campaign location</li>
                  <li>Check if your subscription has ended</li>
                </ul>
              </div>
            </ng-template>
          </div>
        </div>

        <!-- Logout Area -->
        <div class="logout-section">
          <button class="logout-button" (click)="logout()">
            <i class="ri-logout-box-line"></i>
            Logout
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .main-container {
      display: flex;
      height: 100vh;
      background: #f9fafb;
    }

    /* Left Section Styles */
    .left-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 1rem;
      gap: 1rem;
    }

    .nav-section {
      height: 48px;
      display: flex;
      align-items: center;
    }

    .nav-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: white;
      border: none;
      border-radius: 0.75rem;
      color: #eb7641;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.2s;
    }

    .nav-button:hover {
      background: #eb764115;
    }

    .content-section {
      position: relative;
      flex: 1;
      background: white;
      border-radius: 1rem;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .video-section, .map-section {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      transition: opacity 0.3s ease;
    }

    .hidden {
      opacity: 0;
      pointer-events: none;
    }

    .video-wrapper {
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #000;
      position: relative;
      aspect-ratio: 16 / 9;
    }

    /* Right Section Styles */
    .right-section {
      width: 320px;
      display: flex;
      flex-direction: column;
      padding: 1rem;
      gap: 1rem;
    }

    .window-controls {
      height: 48px;
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
    }

    .control-button {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 0.5rem;
      background: white;
      color: #6b7280;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.2s;
    }

    .control-button:hover {
      background: #f3f4f6;
    }

    .close-button {
      color: #ef4444;
    }

    .close-button:hover {
      background: #fee2e2;
    }

    .playlist-section {
      flex: 1;
      background: white;
      border-radius: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .playlist-header {
      padding: 1.25rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
      border-bottom: 1px solid #e5e7eb;
    }

    .playlist-items {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .playlist-item {
      padding: 1rem;
      background: white;
      border-radius: 0.75rem;
      cursor: pointer;
      border: 1px solid #e5e7eb;
      border-left: 3px solid transparent;
      transition: all 0.2s;
    }

    .playlist-item:hover {
      background: #f9fafb;
      transform: translateX(2px);
    }

    .playlist-item.active {
      background: #eb764115;
      border-left-color: #eb7641;
    }

    .item-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .item-title {
      font-weight: 600;
      color: #eb7641;
    }

    .item-type {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .item-status {
      font-size: 0.875rem;
      color: #eb7641;
      font-weight: 600;
    }

    .logout-section {
      height: 48px;
      display: flex;
      justify-content: center;
    }

    .logout-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: white;
      border: none;
      border-radius: 0.75rem;
      color: #ef4444;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.2s;
    }

    .logout-button:hover {
      background: #fee2e2;
    }

    /* Map-specific styles */
    .view-toggle-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: white;
      border: none;
      border-radius: 0.75rem;
      color: #eb7641;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin-left: 1rem;
      transition: all 0.2s;
    }

    .view-toggle-button:hover {
      background: #eb764115;
    }

    .loading-map {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #6b7280;
      font-size: 1.125rem;
    }

    /* Location update styles */
    .location-update-container {
      position: absolute;
      top: 20px;
      left: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 20px;
      transition: background-color 0.3s ease;
      z-index: 1000;
      background-color: rgba(0, 0, 0, 0.7);
    }

    .location-update-container.active {
      background-color: rgba(235, 118, 65, 0.9);
      animation: pulse 0.5s ease;
    }

    .location-update-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background-color: #eb7641;
    }

    .location-update-container.active .location-update-indicator {
      animation: blink 1s infinite;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    .location-update-text {
      font-size: 12px;
      color: white;
      font-weight: 600;
    }

    /* Download queue styles */
    .download-section {
      background: white;
      border-radius: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin-bottom: 1rem;
      overflow: hidden;
    }

    .section-header {
      padding: 1rem;
      font-weight: 600;
      color: #1f2937;
      border-bottom: 1px solid #e5e7eb;
    }

    .download-items {
      padding: 0.5rem;
      max-height: 300px;
      overflow-y: auto;
    }

    .download-item {
      padding: 0.75rem;
      border-radius: 0.5rem;
      margin-bottom: 0.5rem;
      background: #f9fafb;
    }

    .download-info {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .item-title-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .cycle-count {
      font-size: 12px;
      color: #666;
      margin-left: 8px;
    }

    .progress-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .progress-bar-wrapper {
      flex: 1;
      height: 0.5rem;
      background: #e5e7eb;
      border-radius: 0.25rem;
      overflow: hidden;
    }

    .progress-bar {
      height: 100%;
      background: #eb7641;
      border-radius: 0.25rem;
      transition: width 0.3s ease;
    }

    .progress-text {
      min-width: 3rem;
      font-size: 0.75rem;
      color: #6b7280;
      text-align: right;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      
      &.pending {
        color: #9ca3af;
      }
      
      &.completed {
        color: #10b981;
      }
      
      &.error {
        color: #ef4444;
        justify-content: space-between;
      }
    }

    .retry-button {
      padding: 0.25rem 0.75rem;
      border-radius: 0.375rem;
      background: #ef4444;
      color: white;
      border: none;
      font-size: 0.875rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      transition: background 0.2s;

      &:hover {
        background: #dc2626;
      }

      i {
        font-size: 1rem;
      }
    }

    .error-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      background: #fee2e2;
      color: #dc2626;
      border-radius: 12px;
      font-size: 12px;
      margin-left: 8px;
    }

    .has-error {
      border-left: 3px solid #dc2626 !important;
    }

    .has-error .item-title {
      color: #dc2626;
    }

    .image-container {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      background: #000;
    }

    .campaign-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      position: absolute;
      top: 0;
      left: 0;
    }

    .image-countdown {
      position: absolute;
      top: 20px;
      right: 20px;
      background: #eb7641;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 1.2rem;
      font-weight: bold;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .no-media-message {
      padding: 1.5rem;
      color: #6b7280;
      text-align: left;
      font-size: 0.875rem;
      line-height: 1.5;
      
      ul {
        margin-top: 0.5rem;
        padding-left: 1.5rem;
        
        li {
          margin-bottom: 0.25rem;
          
          &:last-child {
            margin-bottom: 0;
          }
        }
        li::marker {
          color: #eb7641;
        }
      }
    }

    .warning-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      background: #fff3e0;
      color: #eb7641;
      border-radius: 12px;
      font-size: 12px;
      margin-left: 8px;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.7; }
      100% { opacity: 1; }
    }

    .warning-badge i {
      font-size: 14px;
    }
  `]
})
export class VideoPlayPageComponent implements OnInit, OnDestroy {
  @ViewChild('videoPlayer') videoPlayer?: VideoPlayerComponent;
  @ViewChild(GoogleMap) googleMap!: GoogleMap;
  
  currentMedia: MediaItem | null = null;
  downloadQueue: DownloadQueueItem[] = [];
  private SOURCE = "video-play-page.component.ts";
  private locationSubscription: Subscription | null = null;
  private campaigns: Campaign[] = [];
  private imageDisplayTimeout: any = null;
  private readonly IMAGE_DISPLAY_DURATION = 5000; // 5 seconds
  private currentlyPlayingId: string | null = null;  // Add this to track current media ID
  playQueue: QueueItem[] = [];
  currentQueueIndex: number = 0;
  private currentCampaignIds: Set<string> = new Set();
  showBackButton = true;
  noMediaMessage: string = 'No media available to display';
  showLocationUpdate: boolean = false;
  private imageTimer: any = null;
  remainingTime: number = 0;
  private isDownloading = false;
  private pendingCampaigns: Map<string, any> = new Map();  // Store received campaigns temporarily
  private campaignSubscription: Subscription | null = null;
  private isTransitioning: boolean = false;  // Add this flag to prevent multiple transitions
  private locationStack: { latitude: number; longitude: number }[] = [];
  private readonly MAX_STACK_SIZE = 10; // Keep only last 10 locations to prevent memory bloat
  showMap: boolean = false;
  isGoogleMapsLoaded: boolean = false;
  markers: google.maps.Marker[] = [];
  infoWindows: google.maps.InfoWindow[] = [];
  currentLocationMarker: google.maps.Marker | null = null;
  private routesService: google.maps.DirectionsService | null = null;
  private currentPolyline: google.maps.Polyline | null = null;
  private isRouteCalculated = false;
  // Add route update timer property
  private routeUpdateTimer: any = null;
  // Add debounce property
  private cycleCheckDebounceTimer: any;
  private readonly DEBOUNCE_TIME = 1000; // 1 second

  mapOptions: google.maps.MapOptions = {
    center: { lat: 33.6615, lng: 73.0635 },
    zoom: 12,
    mapTypeId: 'roadmap',
    disableDefaultUI: true,
    draggableCursor: 'grab',
    draggingCursor: 'grabbing',
    gestureHandling: 'greedy',
    styles: [
      {
        featureType: 'all',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#eb7641' }]
      }
    ]
  };

  // Add to class properties
  private warningMap = new Map<string, {show: boolean, remainingCycles: number}>();

  constructor(
    private loggingService: LoggingService,
    private campaignService: CampaignService,
    private electronService: ElectronService,
    private authService: AuthService,
    private socketService: SocketService,
    private ngZone: NgZone,
    private http: HttpClient
  ) {
    // Monitor socket connection status
    this.socketService.getConnectionStatus().subscribe(
      isConnected => {
        if (!isConnected) {
          console.log('Driver socket disconnected, attempting to reconnect...');
          this.socketService.reconnect();
        }
      }
    );
  }

  minimizeWindow(): void {
    this.electronService.minimizeWindow();
  }

  async closeWindow() {
    // First close the external window
    await this.electronService.closeExternalWindow();
    // Then close the main window
    this.electronService.closeWindow();
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  private getValidMediaForLocation(currentLocation: { latitude: number, longitude: number }): any[] {
    const timezone = environment.TZ || 'America/Chicago';
    const now = moment().tz(timezone);

    

    return this.campaigns.filter(campaign => {
      
      // console.log(
      //   'getValidMediaForLocation',
      //   'Total campaigns being processed:',
      //   {
      //     count: this.campaigns.length
      //   }
      // );

      // Parse dates with explicit format in timezone
      const campaignStart = moment.tz(campaign.startDateTime, 'YYYY-MM-DD H:mm:ss z', timezone);
      const campaignEnd = moment.tz(campaign.endDateTime, 'YYYY-MM-DD H:mm:ss z', timezone);

      // Verify the dates are valid
      if (!campaignStart.isValid() || !campaignEnd.isValid()) {
        // console.log(
        //   'getValidMediaForLocation',
        //   'Invalid campaign dates:',
        //   {
        //     id: campaign._id,
        //     name: campaign.campaignName,
        //     startDate: campaign.startDateTime,
        //     endDate: campaign.endDateTime
        //   }
        // );
        return false;
      }

      // Check date range
      const isWithinDateRange = now.isBetween(campaignStart, campaignEnd, 'minute', '[]');
      if (!isWithinDateRange) {
        // console.log(
        //   'getValidMediaForLocation',
        //   'Campaign outside date range:',
        //   {
        //     id: campaign._id,
        //     name: campaign.campaignName,
        //     startDate: campaignStart.format(),
        //     endDate: campaignEnd.format(),
        //     currentTime: now.format()
        //   }
        // );
        return false;
      }

      // Time window check in the specified timezone
      const startTimeInMinutes = campaignStart.hours() * 60 + campaignStart.minutes();
      const endTimeInMinutes = campaignEnd.hours() * 60 + campaignEnd.minutes();
      const currentTimeInMinutes = now.hours() * 60 + now.minutes();

      const isWithinTimeWindow = currentTimeInMinutes >= startTimeInMinutes && 
                               currentTimeInMinutes <= endTimeInMinutes;

      if (!isWithinTimeWindow) {
        // console.log(
        //   'getValidMediaForLocation',
        //   'Campaign outside time window:',
        //   {
        //     id: campaign._id,
        //     name: campaign.campaignName,
        //     startTime: `${Math.floor(startTimeInMinutes/60)}:${startTimeInMinutes%60}`,
        //     endTime: `${Math.floor(endTimeInMinutes/60)}:${endTimeInMinutes%60}`,
        //     currentTime: `${Math.floor(currentTimeInMinutes/60)}:${currentTimeInMinutes%60}`
        //   }
        // );
        return false;
      }

      // Check locations
      const isWithinAnyRadius = campaign.selectedLocations.some((loc: any) => {
        const distance = this.calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          loc.latitude,
          loc.longitude
        );

        const isWithin = distance <= loc.radius;
        
        return isWithin;
      });

      if (!isWithinAnyRadius) {
        // console.log(
        //   'getValidMediaForLocation',
        //   'Campaign not within any configured radius:',
        //   {
        //     id: campaign._id,
        //     name: campaign.campaignName,
        //     locationCount: campaign.selectedLocations.length
        //   }
        // );
        return false;
      }

     

      return true;
    });
  }

  private async getLocalMediaUrl(path: string): Promise<string> {
    try {
      // Use electron service to get proper file URL
      return await this.electronService.getLocalVideoUrl(path); // This works for both videos and images
    } catch (error) {
      // console.log(this.SOURCE + ' : getLocalMediaUrl', 'Error getting local media URL:', error);
      throw error;
    }
  }

  private shouldUpdateMedia(newMedia: MediaInfo): boolean {
    // If nothing is playing, we should update
    if (!this.currentlyPlayingId) {
      return true;
    }

    // If the same media is already playing, don't update
    if (this.currentlyPlayingId === newMedia._id) {
      return false;
    }

    return true;
  }

  private async displayMedia(mediaToPlay: MediaInfo) {
    // console.log(
    //   'MEDIA_TRANSITION',
    //   'Starting media transition:',
    //   {
    //     mediaId: mediaToPlay._id,
    //     mediaType: mediaToPlay.mediaType,
    //     isTransitioning: this.isTransitioning,
    //     currentlyPlayingId: this.currentlyPlayingId,
    //     queueLength: this.playQueue.length,
    //     currentQueueIndex: this.currentQueueIndex
    //   }
    // );

    // Check if we should update the media
    if (!this.shouldUpdateMedia(mediaToPlay)) {
      return;
    }

    try {
      const localUrl = await this.getLocalMediaUrl(mediaToPlay.downloadedUrl);

      // Set transitioning flag
      this.isTransitioning = true;

      // Cleanup current media before updating
      this.cleanupCurrentMedia();
      
      // Use setTimeout to ensure DOM updates
      setTimeout(() => {
        this.currentMedia = {
          path: localUrl,
          type: mediaToPlay.mediaType.toLowerCase() as 'video' | 'image',
          duration: mediaToPlay.mediaDuration || (mediaToPlay.mediaType.toLowerCase() === 'image' ? 5 : 0)
        };

        // console.log(
        //   'MEDIA_TRANSITION',
        //   'Media object created:',
        //   {
        //     currentMedia: this.currentMedia,
        //     queueIndex: this.currentQueueIndex
        //   }
        // );

        // Update currently playing ID
        this.currentlyPlayingId = mediaToPlay._id;

        // Send sync action to external display
        this.electronService.syncVideoAction({
          type: 'loadVideo',
          url: localUrl,
          mediaType: mediaToPlay.mediaType.toLowerCase(),
          autoplay: true
        });

        // Clear transitioning flag after a short delay
        setTimeout(() => {
          this.isTransitioning = false;
          // console.log(
          //   'MEDIA_TRANSITION',
          //   'Transition completed',
          //   {
          //     mediaId: mediaToPlay._id,
          //     currentQueueIndex: this.currentQueueIndex
          //   }
          // );
        }, 500);

      }, 100);

    } catch (error) {
      // console.log('MEDIA_TRANSITION', 'Error setting media:', error);
      this.currentlyPlayingId = null;
      this.isTransitioning = false;

      // If there's an error, try to play the next item in queue
      if (this.playQueue.length > 1) {
        const nextIndex = (this.currentQueueIndex + 1) % this.playQueue.length;
        this.playQueueItem(nextIndex);
      }
    }
  }

  onImageLoaded() {
    console.log(
      'IMAGE_LIFECYCLE',
      'Image loaded event:',
      {
        currentMediaPath: this.currentMedia?.path,
        currentMediaType: this.currentMedia?.type,
        duration: this.currentMedia?.duration,
        queueIndex: this.currentQueueIndex,
        isTransitioning: this.isTransitioning,
        hasTimer: !!this.imageTimer
      }
    );

    // Wait for transition to complete before starting timer
    setTimeout(() => {
      console.log(
        'IMAGE_LIFECYCLE',
        'Starting timer after transition delay:',
        {
          currentMediaType: this.currentMedia?.type,
          duration: this.currentMedia?.duration,
          isTransitioning: this.isTransitioning
        }
      );
      
      // Start the timer if it's an image and has duration
      if (this.currentMedia?.type === 'image' && this.currentMedia.duration) {
        this.startImageTimer(this.currentMedia.duration);
      }
    }, 500);
  }

  onImageError(event: any) {
    // console.log(
    //   this.SOURCE + ' : onImageError',
    //   'Error loading image:',
    //   {
    //     src: event.target.src,
    //     error: event,
    //     currentMedia: this.currentMedia,
    //     naturalWidth: event.target.naturalWidth,
    //     naturalHeight: event.target.naturalHeight,
    //     complete: event.target.complete,
    //     readyState: event.target.readyState
    //   }
    // );
  }

  private moveToNextMedia() {
    this.currentMedia = null;
    this.currentlyPlayingId = null;  // Reset ID when moving to next media
  }

  async handleVideoError(event: any) {
    // Only handle errors if not transitioning
    if (this.isTransitioning) {
      // console.log(
      //   'VIDEO_ERROR',
      //   'Ignoring error during transition'
      // );
      return;
    }

    const currentItem = this.playQueue[this.currentQueueIndex];
    if (!currentItem) return;

    // console.log(
    //   'VIDEO_ERROR',
    //   'Handling video error:',
    //   {
    //     name: currentItem.campaignName,
    //     error: event,
    //     currentIndex: this.currentQueueIndex
    //   }
    // );

    // Mark error and move to next
    currentItem.hasPlaybackError = true;
    const nextIndex = (this.currentQueueIndex + 1) % this.playQueue.length;
    this.currentQueueIndex = nextIndex;
    this.playQueueItem(nextIndex);
  }

  async onMediaEnded() {
    console.log(
      'MEDIA_TRANSITION',
      'Media ended event:',
      {
        currentCampaign: this.playQueue[this.currentQueueIndex]?.campaignName,
        currentCycles: this.playQueue[this.currentQueueIndex]?.runCycleCount,
        subscriptionCycles: this.playQueue[this.currentQueueIndex]?.userId?.currentSubscription?.currentCycles,
        maxCycles: this.playQueue[this.currentQueueIndex]?.userId?.currentSubscription?.runCycleLimit,
        isTransitioning: this.isTransitioning
      }
    );

    if (this.isTransitioning) return;

    const currentItem = this.playQueue[this.currentQueueIndex];
    if (!currentItem) return;

    try {
      this.isTransitioning = true;

      // Update cycle count and get response
      const response = await this.updateCampaignCycle(currentItem._id);
      
      console.log(
        'MEDIA_TRANSITION',
        'Cycle update response:',
        {
          campaignName: currentItem.campaignName,
          oldCycles: currentItem.runCycleCount,
          newSubscriptionCycles: response?.data?.userId?.currentSubscription?.currentCycles,
          maxCycles: response?.data?.userId?.currentSubscription?.runCycleLimit,
          isSubscriptionCompleted: response?.data?.userId?.currentSubscription?.isCompleted
        }
      );

      // Check if subscription is completed from response
      if (response?.data?.userId?.currentSubscription?.isCompleted) {
        console.log(
          'MEDIA_TRANSITION',
          'Subscription completed, removing campaigns:',
          {
            removedCampaign: currentItem.campaignName,
            currentQueueSize: this.playQueue.length
          }
        );

        // Remove this campaign from campaigns array and play queue
        this.campaigns = this.campaigns.filter(camp => camp._id !== currentItem._id);
        this.playQueue = this.playQueue.filter(item => item._id !== currentItem._id);
        
        // If no more campaigns in queue, clear current media
        if (this.playQueue.length === 0) {
          await this.cleanupCurrentMedia();
          this.currentQueueIndex = 0;
          this.noMediaMessage = 'No more campaigns available to play';
          this.isTransitioning = false;
          return;
        }
      } else {
        // Update local cycle count if subscription not completed
        currentItem.runCycleCount++;
      }

      // Calculate next index (considering possibly reduced queue)
      const nextIndex = (this.currentQueueIndex + 1) % this.playQueue.length;
      
      // Clean up current media
      await this.cleanupCurrentMedia();

      // Update index and play next item
      this.currentQueueIndex = nextIndex;
      
      // Clear transitioning before playing next
      this.isTransitioning = false;
      
      console.log(
        'MEDIA_TRANSITION',
        'Moving to next media:',
        {
          nextCampaign: this.playQueue[nextIndex]?.campaignName,
          nextCycles: this.playQueue[nextIndex]?.runCycleCount,
          subscriptionCycles: this.playQueue[nextIndex]?.userId?.currentSubscription?.currentCycles
        }
      );
      
      // Play next item
      await this.playQueueItem(nextIndex);

      // Update warning states after cycle update
      this.updateWarnings();

    } catch (error) {
      console.log('MEDIA_TRANSITION', 'Error during transition:', error);
      this.isTransitioning = false;
    }
  }

  private async cleanupCurrentMedia(): Promise<void> {
    console.log(
      'MEDIA_CLEANUP',
      'Starting media cleanup:',
      {
        currentMediaType: this.currentMedia?.type,
        hasImageTimer: !!this.imageTimer,
        isTransitioning: this.isTransitioning,
        queueIndex: this.currentQueueIndex
      }
    );

    return new Promise((resolve) => {
      // Stop video if playing
      if (this.currentMedia?.type === 'video' && this.videoPlayer) {
        console.log('MEDIA_CLEANUP', 'Cleaning up video player');
        this.videoPlayer.cleanup();
      }

      // Clear image timer
      if (this.imageTimer) {
        console.log('MEDIA_CLEANUP', 'Clearing image timer');
        clearInterval(this.imageTimer);
        this.imageTimer = null;
      }

      // Clear current media state
      this.currentMedia = null;
      this.currentlyPlayingId = null;

      // Resolve immediately
      // console.log('MEDIA_CLEANUP', 'Cleanup completed');
      resolve();
    });
  }

  private async playCurrentQueueItem() {
    if (this.isTransitioning) {
      // console.log(
      //   'MEDIA_PLAYBACK',
      //   'Skipping playCurrentQueueItem - transition in progress'
      // );
      return;
    }

    const currentItem = this.playQueue[this.currentQueueIndex];
    
    if (!currentItem) {
      // console.log(
      //   'MEDIA_PLAYBACK',
      //   'No item found at current index',
      //   { index: this.currentQueueIndex }
      // );
      return;
    }

    try {
      this.isTransitioning = true;
      
      // Get local file URL
      const localUrl = await this.electronService.getLocalVideoUrl(currentItem.downloadedUrl);
      
      // Create new media object
      const newMedia = {
        path: localUrl,
        type: currentItem.mediaType.toLowerCase() as 'video' | 'image',
        duration: currentItem.mediaDuration
      };

      // Update state
      this.currentMedia = newMedia;
      this.currentlyPlayingId = currentItem._id;

      // Send sync action to external display
      this.electronService.syncVideoAction({
        type: 'loadVideo',
        url: localUrl,
        mediaType: currentItem.mediaType.toLowerCase(),
        autoplay: true
      });

      // console.log(
      //   'MEDIA_PLAYBACK',
      //   'Media playback started:',
      //   {
      //     id: currentItem._id,
      //     name: currentItem.campaignName,
      //     type: currentItem.mediaType,
      //     index: this.currentQueueIndex
      //   }
      // );

    } catch (error) {
      // console.log(
      //   'MEDIA_PLAYBACK',
      //   'Error playing media:',
      //   error
      // );
      // Try next item on error
      const nextIndex = (this.currentQueueIndex + 1) % this.playQueue.length;
      this.currentQueueIndex = nextIndex;
      await this.playCurrentQueueItem();
    } finally {
      setTimeout(() => {
        this.isTransitioning = false;
      }, 500);
    }
  }

  private updateMediaQueue(validMedia: any[]) {
    console.log(
      'QUEUE',
      'Updating media queue:',
      {
        validMediaCount: validMedia.length,
        currentQueueSize: this.playQueue.length,
        currentlyPlaying: this.currentlyPlayingId
      }
    );

    // Get new campaign IDs
    const newCampaignIds = new Set(validMedia.map(media => media._id));
    const hasChanged = this.hasCampaignsChanged(this.currentCampaignIds, newCampaignIds);

    console.log(
      'QUEUE',
      'Queue change check:',
      {
        hasChanged,
        oldIds: Array.from(this.currentCampaignIds),
        newIds: Array.from(newCampaignIds)
      }
    );

    if (validMedia.length === 0) {
      console.log(
        'QUEUE',
        'No valid media to display',
        {
          currentQueueSize: this.playQueue.length,
          totalCampaigns: this.campaigns.length
        }
      );
      this.playQueue = [];
      this.currentQueueIndex = 0;
      this.currentMedia = null;
      this.currentlyPlayingId = null;
      
      // Clear external display
      this.electronService.syncVideoAction({
        type: 'clearMedia'
      });
      
      this.noMediaMessage = 'No campaigns available for current location. Please wait for location update or move to a valid campaign location.';
      return;
    }

    if (hasChanged) {
      console.log(
        'QUEUE',
        'Updating queue with new media:',
        {
          oldQueueSize: this.playQueue.length,
          newMediaCount: validMedia.length,
          currentlyPlaying: this.currentlyPlayingId
        }
      );

      // Store the currently playing media ID before updating queue
      const currentPlayingMediaId = this.playQueue[this.currentQueueIndex]?._id;

      this.playQueue = validMedia.map(media => ({
        _id: media._id,
        campaignName: media.campaignName || 'Untitled Campaign',
        mediaType: media.mediaType,
        downloadedUrl: media.downloadedUrl,
        isPlaying: false,
        mediaDuration: media.mediaDuration,
        runCycleCount: media.runCycleCount || 0,
        maxRunCycleLimit: media.userId?.currentSubscription?.runCycleLimit || 0,
        userId: {
          currentSubscription: media.userId?.currentSubscription ? {
            _id: media.userId.currentSubscription._id,
            runCycleLimit: media.userId.currentSubscription.runCycleLimit,
            currentCycles: media.userId.currentSubscription.currentCycles,
            isCompleted: media.userId.currentSubscription.isCompleted
          } : undefined
        }
      }));

      // Update current campaign IDs
      this.currentCampaignIds = newCampaignIds;

      // If current media is not in the new queue, play the first item
      const currentMediaStillValid = this.playQueue.some(item => item._id === currentPlayingMediaId);
      
      console.log(
        'QUEUE',
        'Queue update complete:',
        {
          newQueueSize: this.playQueue.length,
          currentMediaId: currentPlayingMediaId,
          isCurrentMediaValid: currentMediaStillValid,
          willPlayFirst: !currentMediaStillValid && this.playQueue.length > 0
        }
      );

      if (!currentMediaStillValid) {
        if (this.playQueue.length > 0) {
          this.playQueueItem(0);
        } else {
          // Clear external display if queue is empty
          this.electronService.syncVideoAction({
            type: 'clearMedia'
          });
        }
      }
    }
  }

  // Add helper method to compare campaign sets
  private hasCampaignsChanged(current: Set<string>, next: Set<string>): boolean {
    if (current.size !== next.size) return true;

    for (const id of current) {
      if (!next.has(id)) return true;
    }

    for (const id of next) {
      if (!current.has(id)) return true;
    }

    return false;
  }

  async playQueueItem(index: number) {
    if (index < 0 || index >= this.playQueue.length) {
      return;
    }

    // console.log(
    //   'MEDIA_PLAYBACK',
    //   'Attempting to play queue item:',
    //   {
    //     position: index + 1,
    //     name: this.playQueue[index].campaignName,
    //     type: this.playQueue[index].mediaType,
    //     totalItems: this.playQueue.length,
    //     isTransitioning: this.isTransitioning,
    //     hasImageTimer: !!this.imageTimer
    //   }
    // );

    try {
      this.isTransitioning = true;

      // Clear any existing image timer first
      if (this.imageTimer) {
        clearInterval(this.imageTimer);
        this.imageTimer = null;
      }

      // Clean up current media first
      await this.cleanupCurrentMedia();
      
      const mediaToPlay = this.playQueue[index];

      // Remove error flag if present
      mediaToPlay.hasPlaybackError = false;

      const localUrl = await this.electronService.getLocalVideoUrl(mediaToPlay.downloadedUrl);

      // Create new media object
      const newMedia = {
        path: localUrl,
        type: mediaToPlay.mediaType.toLowerCase() as 'video' | 'image',
        duration: mediaToPlay.mediaDuration || (mediaToPlay.mediaType.toLowerCase() === 'image' ? 5 : 0)
      };

      // Update state
      this.currentMedia = newMedia;
      this.currentlyPlayingId = mediaToPlay._id;

      // Send sync action to external display
      this.electronService.syncVideoAction({
        type: 'loadVideo',
        url: localUrl,
        mediaType: mediaToPlay.mediaType.toLowerCase(),
        autoplay: true
      });

      // console.log(
      //   'MEDIA_PLAYBACK',
      //   'Media playback started:',
      //   {
      //     id: mediaToPlay._id,
      //     name: mediaToPlay.campaignName,
      //     type: mediaToPlay.mediaType,
      //     index: index,
      //     duration: newMedia.duration
      //   }
      // );

    } catch (error) {
      // console.log(
      //   'MEDIA_PLAYBACK',
      //   'Error playing media:',
      //   error
      // );

      // Mark the current item as having an error
      this.playQueue[index].hasPlaybackError = true;

      // Try next item on error after a delay
      setTimeout(() => {
        if (this.playQueue.length > 1) {
          const nextIndex = (index + 1) % this.playQueue.length;
          this.currentQueueIndex = nextIndex;
          this.playQueueItem(nextIndex);
        }
      }, 500);
    } finally {
      // Reset transition state after a delay
      setTimeout(() => {
        this.isTransitioning = false;
      }, 300);
    }
  }

  public async playNext() {
    const currentItem = this.playQueue[this.currentQueueIndex];
    
    // console.log(
    //   'MEDIA_PLAYBACK',
    //   'Attempting to play next item:',
    //   {
    //     currentName: currentItem?.campaignName,
    //     currentPosition: this.currentQueueIndex + 1,
    //     totalItems: this.playQueue.length,
    //     isTransitioning: this.isTransitioning,
    //     nextIndex: (this.currentQueueIndex + 1) % this.playQueue.length
    //   }
    // );

    // Don't proceed if already transitioning
    if (this.isTransitioning) {
      // console.log(
      //   'MEDIA_PLAYBACK',
      //   'Skipping playNext - transition in progress'
      // );
      return;
    }

    // Set transitioning flag
    this.isTransitioning = true;

    try {
      if (this.currentQueueIndex < this.playQueue.length - 1) {
        this.currentQueueIndex++;
        await this.playCurrentQueueItem();
      } else {
        // Loop back to start if there are still items to play
        if (this.playQueue.length > 0) {
          // console.log(
          //   'MEDIA_PLAYBACK',
          //   'Reached end of queue, looping back to start',
          //   {
          //     lastPlayedName: currentItem?.campaignName,
          //     totalItems: this.playQueue.length
          //   }
          // );
          this.currentQueueIndex = 0;
          await this.playCurrentQueueItem();
        } else {
          // console.log(
          //   'MEDIA_PLAYBACK',
          //   'No items in queue to play'
          // );
          this.currentMedia = null;
          this.noMediaMessage = 'No media available to display';
        }
      }
    } catch (error) {
      // console.log(
      //   'MEDIA_PLAYBACK',
      //   'Error during playNext:',
      //   error
      // );
    } finally {
      // Clear transitioning flag after a delay
      setTimeout(() => {
        this.isTransitioning = false;
      }, 500);
    }
  }

  public async playPrevious() {
    // console.log(
    //   'MEDIA_PLAYBACK',
    //   'Attempting to play previous item:',
    //   {
    //     currentIndex: this.currentQueueIndex,
    //     isTransitioning: this.isTransitioning
    //   }
    // );

    // Don't proceed if already transitioning
    if (this.isTransitioning) {
      // console.log(
      //   'MEDIA_PLAYBACK',
      //   'Skipping playPrevious - transition in progress'
      // );
      return;
    }

    // Set transitioning flag
    this.isTransitioning = true;

    try {
      if (this.currentQueueIndex > 0) {
        this.currentQueueIndex--;
        await this.playCurrentQueueItem();
      }
    } catch (error) {
      // console.log(
      //   'MEDIA_PLAYBACK',
      //   'Error during playPrevious:',
      //   error
      // );
    } finally {
      // Clear transitioning flag after a delay
      setTimeout(() => {
        this.isTransitioning = false;
      }, 500);
    }
  }

  private async processDownloadQueue() {
    if (this.isDownloading || this.downloadQueue.length === 0) return;

    // Get next pending item
    const nextItem = this.downloadQueue.find(item => item.status === 'pending');
    if (!nextItem) return;

    this.isDownloading = true;
    try {
      await this.downloadFile(nextItem);
    } finally {
      this.isDownloading = false;
      // Process next item if any
      this.processDownloadQueue();
    }
  }

  private async downloadFile(item: DownloadQueueItem) {
    try {
      // console.log(
      //   'CAMPAIGN_FLOW',
      //   'Starting campaign download:',
      //   {
      //     id: item._id,
      //     name: item.campaignName,
      //     cycles: `${item.runCycleCount}/${item.maxRunCycleLimit}`
      //   }
      // );

      // First check if campaign has reached its run cycle limit
      if (item.runCycleCount >= item.maxRunCycleLimit) {
        this.downloadQueue = this.downloadQueue.filter(qi => qi._id !== item._id);
        // console.log(
        //   'CAMPAIGN_FLOW',
        //   'Skipping download - cycle limit reached:',
        //   {
        //     id: item._id,
        //     name: item.campaignName,
        //     cycles: `${item.runCycleCount}/${item.maxRunCycleLimit}`
        //   }
        // );
        return;
      }

      item.status = 'downloading';
      item.progress = 0;
      const mediaType = this.getFileType(item.mediaUrl);
      
      // Subscribe to download progress
      this.electronService.onDownloadProgress().subscribe(
        (progress: { id: string, progress: number }) => {
          if (progress.id === item._id) {
            item.progress = progress.progress;
          }
        }
      );

      const result = await this.electronService.downloadFile(
        item._id,
        item.mediaUrl,
        mediaType
      );

      if (result.success && result.path) {
        try {
          await this.campaignService.updateCampaignDownloadStatus(item._id, result.path);
          item.downloadedUrl = result.path;
          item.status = 'completed';
          item.progress = 100;
          
          // Remove from download queue
          this.downloadQueue = this.downloadQueue.filter(qi => qi._id !== item._id);

          // Get the original campaign and update its downloadedUrl
          const originalCampaign = this.pendingCampaigns.get(item._id);
          if (originalCampaign) {
            originalCampaign.downloadedUrl = result.path;
            // Set default duration for images if not provided
            if (item.mediaType.toLowerCase() === 'image' && (!originalCampaign.mediaDuration || originalCampaign.mediaDuration === 0)) {
              originalCampaign.mediaDuration = 5; // Default 5 seconds for images
            }

            // Add to campaigns array if not already present
            const existingCampaignIndex = this.campaigns.findIndex(c => c._id === item._id);
            if (existingCampaignIndex === -1) {
              this.campaigns.push(originalCampaign);
              // console.log(
              //   'CAMPAIGN_FLOW',
              //   'Added new campaign to campaigns array:',
              //   {
              //     id: item._id,
              //     name: item.campaignName,
              //     totalCampaigns: this.campaigns.length,
              //     isInQueue: this.playQueue.some(qItem => qItem._id === item._id)
              //   }
              // );
            } else {
              // Update existing campaign
              this.campaigns[existingCampaignIndex] = {
                ...this.campaigns[existingCampaignIndex],
                ...originalCampaign,
                downloadedUrl: result.path
              };
              // console.log(
              //   'CAMPAIGN_FLOW',
              //   'Updated existing campaign:',
              //   {
              //     id: item._id,
              //     name: item.campaignName,
              //     isInQueue: this.playQueue.some(qItem => qItem._id === item._id)
              //   }
              // );
            }
            
            // Remove from pending campaigns
            this.pendingCampaigns.delete(item._id);
          }

          // console.log(
          //   'CAMPAIGN_FLOW',
          //   'Campaign download completed:',
          //   {
          //     id: item._id,
          //     name: item.campaignName,
          //     cycles: `${item.runCycleCount}/${item.maxRunCycleLimit}`,
          //     pendingCampaignsCount: this.pendingCampaigns.size,
          //     totalCampaigns: this.campaigns.length,
          //     isInQueue: this.playQueue.some(qItem => qItem._id === item._id)
          //   }
          // );
        } catch (error) {
          // console.log(
          //   'CAMPAIGN_FLOW',
          //   'Error updating campaign status:',
          //   {
          //     id: item._id,
          //     name: item.campaignName,
          //     error
          //   }
          // );
          item.status = 'error';
          item.error = 'Failed to update campaign status';
        }
      } else {
        throw new Error(result.error || 'Download failed');
      }
    } catch (error: any) {
      // console.log(
      //   'CAMPAIGN_FLOW',
      //   'Campaign download failed:',
      //   {
      //     id: item._id,
      //     name: item.campaignName,
      //     error: error.message
      //   }
      // );
      item.status = 'error';
      item.error = this.getErrorMessage(error);
      item.progress = 0;
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

  private getErrorMessage(error: any): string {
    if (error.message.includes('ENOTFOUND')) {
      return 'Network error: Check your internet connection';
    } else if (error.message.includes('ETIMEDOUT')) {
      return 'Connection timed out';
    } else if (error.message.includes('403')) {
      return 'Access forbidden';
    } else if (error.message.includes('404')) {
      return 'File not found';
    } else if (error.message.includes('ECONNREFUSED')) {
      return 'Connection refused';
    } else {
      return `Download failed: ${error.message}`;
    }
  }

  async retryDownload(item: DownloadQueueItem) {
    if (item.status === 'error') {
      item.status = 'pending';
      item.error = undefined;
      this.processDownloadQueue();
    }
  }

  private addToDownloadQueue(campaign: any) {
    // Get maxRunCycleLimit from user's currentSubscription
    const maxRunCycleLimit = campaign.userId?.currentSubscription?.runCycleLimit || 0;

    // Check if campaign has reached its run cycle limit
    if (campaign.runCycleCount >= maxRunCycleLimit) {
      // console.log(this.SOURCE + ' : addToDownloadQueue', `Campaign ${campaign.campaignName} has reached its run cycle limit (${campaign.runCycleCount}/${maxRunCycleLimit})`);
      return;
    }

    const queueItem: DownloadQueueItem = {
      _id: campaign._id,
      campaignName: campaign.campaignName,
      mediaType: campaign.mediaType,
      mediaUrl: campaign.mediaUrl,
      status: 'pending',
      downloadedUrl: null,
      runCycleCount: campaign.runCycleCount || 0,
      maxRunCycleLimit: maxRunCycleLimit
    };

    // Add to queue if not already present and within cycle limits
    if (!this.downloadQueue.some(item => item._id === campaign._id)) {
      this.downloadQueue.push(queueItem);
      // console.log(this.SOURCE + ' : addToDownloadQueue', `Added campaign ${campaign.campaignName} to download queue (Cycles: ${queueItem.runCycleCount}/${queueItem.maxRunCycleLimit})`);
      
      // Start processing queue if not already processing
      this.processDownloadQueue();
    }
  }

  getDownloadQueue(): DownloadQueueItem[] {
    return this.downloadQueue;
  }

  async ngOnInit() {
    // console.log(
    //   'LIFECYCLE',
    //   'Component initialization started',
    //   {
    //     hasSelectedCampaigns: this.campaigns.length,
    //     hasPlayQueue: this.playQueue.length
    //   }
    // );

    try {
      // Load Google Maps in background
      this.loadGoogleMaps().then(() => {
        this.isGoogleMapsLoaded = true;
      });

      // Add visibility change logging
      document.addEventListener('visibilitychange', () => {
        // console.log(
        //   'VISIBILITY',
        //   'Document visibility changed:',
        //   {
        //     state: document.visibilityState,
        //     currentMediaType: this.currentMedia?.type,
        //     isTransitioning: this.isTransitioning
        //   }
        // );

        // Ensure video continues playing when visibility changes
        if (document.visibilityState === 'hidden' && this.currentMedia?.type === 'video') {
          this.isTransitioning = false;
        }
      });

      // Subscribe to new campaign events
      this.campaignSubscription = this.socketService.getNewCampaigns().subscribe({
        next: (campaign) => {
          // console.log(
          //   'SOCKET',
          //   'Received new campaign:',
          //   {
          //     campaignId: campaign?._id,
          //     campaignName: campaign?.campaignName,
          //     currentQueueSize: this.playQueue.length
          //   }
          // );
          if (campaign) {
            // console.log(
            //   'CAMPAIGN_FLOW',
            //   'Socket received new campaign:',
            //   {
            //     id: campaign._id,
            //     name: campaign.campaignName,
            //     currentCampaignsCount: this.campaigns.length,
            //     currentQueueCount: this.playQueue.length
            //   }
            // );
            
            // Check if campaign already exists in pendingCampaigns
            if (!this.pendingCampaigns.has(campaign._id)) {
              // Store the original campaign
              this.pendingCampaigns.set(campaign._id, campaign);
              // console.log(
              //   'CAMPAIGN_FLOW',
              //   'Added campaign to pending list:',
              //   {
              //     id: campaign._id,
              //     name: campaign.campaignName,
              //     pendingCount: this.pendingCampaigns.size
              //   }
              // );
              
              // First add to download queue
              const downloadItem: DownloadQueueItem = {
                _id: campaign._id,
                campaignName: campaign.campaignName,
                mediaType: campaign.mediaType,
                mediaUrl: campaign.mediaUrl,
                status: 'pending',
                downloadedUrl: null,
                runCycleCount: campaign.runCycleCount || 0,
                maxRunCycleLimit: campaign.userId?.currentSubscription?.runCycleLimit || 0
              };


              // Add to download queue if not already present
              if (!this.downloadQueue.some(item => item._id === campaign._id)) {
                this.downloadQueue.push(downloadItem);
                // console.log(
                //   'CAMPAIGN_FLOW',
                //   'Added campaign to download queue:',
                //   {
                //     id: campaign._id,
                //     name: campaign.campaignName,
                //     queueSize: this.downloadQueue.length
                //   }
                // );
                
                // Start processing queue if not already processing
                this.processDownloadQueue();
              }
            } else {
              // console.log(
              //   'CAMPAIGN_FLOW',
              //   'Campaign already exists in pending campaigns, skipping:',
              //   {
              //     id: campaign._id,
              //     name: campaign.campaignName
              //   }
              // );
            }
          }
        }
      });

      // Get display configuration from localStorage
      const displayConfigStr = localStorage.getItem('selectedDisplay');
      if (!displayConfigStr) {
        console.log('INIT', 'No display configuration found');
        return;
      }

      const displayConfig = JSON.parse(displayConfigStr);
      // console.log(
      //   'INIT',
      //   'Retrieved display config:',
      //   { config: displayConfig }
      // );

      // Create external window with display config
      const created = await this.electronService.createExternalWindow(displayConfig);
      if (!created) {
        console.log('INIT', 'Failed to create external window');
        return;
      }

      // Get campaigns
      this.campaigns = this.campaignService.getPlayableCampaigns();
      // console.log(
      //   'INIT',
      //   'Retrieved playable campaigns:',
      //   {
      //     count: this.campaigns.length,
      //     campaigns: this.campaigns.map((c:any) => ({
      //       id: c._id,
      //       name: c.campaignName,
      //       cycles: `${c.runCycleCount}/${c.userId?.currentSubscription?.runCycleLimit}`,
      //       subscriptionCycles: c.userId?.currentSubscription?.currentCycles
      //     }))
      //   }
      // );

      // Subscribe to location updates
      this.locationSubscription = this.electronService.onLocationUpdate()
        .subscribe({
          next: (location: any) => {
            // console.log(
            //   'LOCATION',
            //   'Received location update:',
            //   {
            //     location,
            //     currentQueueSize: this.playQueue.length,
            //     currentMediaType: this.currentMedia?.type
            //   }
            // );
            // Push new location to stack, maintain max size
            this.locationStack.push({
              latitude: location.latitude,
              longitude: location.longitude
            });
            
            // Keep stack size in check
            if (this.locationStack.length > this.MAX_STACK_SIZE) {
              this.locationStack.shift(); // Remove oldest location
            }

            const validMedia = this.getValidMediaForLocation(location);
            
            this.updateMediaQueue(validMedia);

            // Show the location update indicator
            this.showLocationUpdate = true;

            // Hide it after 3 seconds
            setTimeout(() => {
              this.showLocationUpdate = false;
            }, 500);

            // Update map if visible
            if (this.isGoogleMapsLoaded && this.googleMap?.googleMap) {
              this.updateCurrentLocation(location);
              if (!this.isRouteCalculated) {
                this.updateOptimalRoute();
                this.isRouteCalculated = true;
              }
            }
          },
          error: (error) => {
            // console.log(
            //   'CAMPAIGN_FLOW',
            //   'Error in location subscription:',
            //   error
            // );
          }
        });

    } catch (error) {
      console.log('INIT', 'Error in initialization:', error);
    }
  }

  ngOnDestroy() {
    // Clear route update timer
    this.clearRouteUpdateTimer();

    // Clean up socket connection
    this.socketService.disconnect();

    if (this.locationSubscription) {
      this.locationSubscription.unsubscribe();
    }

    if (this.campaignSubscription) {
      this.campaignSubscription.unsubscribe();
    }

    if (this.imageDisplayTimeout) {
      clearTimeout(this.imageDisplayTimeout);
      this.imageDisplayTimeout = null;
    }

    this.electronService.closeExternalWindow()
      .then(closed => {
      })
      .catch(error => {
        // console.log(this.SOURCE + ' : ngOnDestroy', 'Error closing external window:', error);
      });

    if (this.imageTimer) {
      clearInterval(this.imageTimer);
      this.imageTimer = null;
    }

    // Clear cycle check timer
    if (this.cycleCheckDebounceTimer) {
      clearTimeout(this.cycleCheckDebounceTimer);
    }

    // Clear warning states
    this.warningMap.clear();
  }

  goBack() {
    window.history.back();
  }

  logout() {
    this.authService.logout();
  }

  public formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  private startImageTimer(duration: number) {
    if (!duration || duration <= 0) {
      console.log(
        'IMAGE_TIMER_DEBUG',
        'Invalid duration, skipping timer:',
        { duration }
      );
      return;
    }

    // Prevent multiple timers
    if (this.imageTimer) {
      // console.log(
      //   'IMAGE_TIMER_DEBUG',
      //   'Timer already exists, clearing:',
      //   {
      //     remainingTime: this.remainingTime,
      //     currentQueueIndex: this.currentQueueIndex,
      //     isTransitioning: this.isTransitioning
      //   }
      // );
      clearInterval(this.imageTimer);
      this.imageTimer = null;
    }

    this.remainingTime = duration;
    const endTime = Date.now() + (duration * 1000);

    // console.log(
    //   'IMAGE_TIMER_DEBUG',
    //   'Creating new timer:',
    //   {
    //     duration,
    //     endTime: new Date(endTime).toISOString(),
    //     currentQueueIndex: this.currentQueueIndex,
    //     queueLength: this.playQueue.length
    //   }
    // );

    this.imageTimer = setInterval(() => {
      const now = Date.now();
      const previousTime = this.remainingTime;
      this.remainingTime = Math.max(0, Math.ceil((endTime - now) / 1000));

      // Log only when time changes
      if (previousTime !== this.remainingTime) {
        // console.log(
        //   'IMAGE_TIMER_DEBUG',
        //   'Timer tick:',
        //   {
        //     remainingTime: this.remainingTime,
        //     isTransitioning: this.isTransitioning,
        //     currentMediaType: this.currentMedia?.type
        //   }
        // );
      }
      
      if (this.remainingTime <= 0) {
        // console.log(
        //   'IMAGE_TIMER_DEBUG',
        //   'Timer completed:',
        //   {
        //     currentQueueIndex: this.currentQueueIndex,
        //     queueLength: this.playQueue.length,
        //     isTransitioning: this.isTransitioning
        //   }
        // );
        
        clearInterval(this.imageTimer);
        this.imageTimer = null;
        this.onImageTimerComplete();
      }
    }, 100);
  }

  private async onImageTimerComplete() {
    // console.log(
    //   'IMAGE_TIMER_DEBUG',
    //   'Timer completion handler started:',
    //   {
    //     hasCurrentMedia: !!this.currentMedia,
    //     mediaType: this.currentMedia?.type,
    //     isTransitioning: this.isTransitioning,
    //     currentQueueIndex: this.currentQueueIndex,
    //     queueLength: this.playQueue.length
    //   }
    // );

    // Guard clauses with detailed logging
    if (this.isTransitioning) {
      // console.log(
      //   'IMAGE_TIMER_DEBUG',
      //   'Skipping completion - transition in progress'
      // );
      return;
    }

    if (!this.currentMedia || this.currentMedia.type !== 'image') {
      console.log(
        'IMAGE_TIMER_DEBUG',
        'Skipping completion - invalid media state:',
        {
          hasMedia: !!this.currentMedia,
          mediaType: this.currentMedia?.type
        }
      );
      return;
    }

    const currentItem = this.playQueue[this.currentQueueIndex];
    if (!currentItem) {
      console.log(
        'IMAGE_TIMER_DEBUG',
        'Skipping completion - no queue item'
      );
      return;
    }

    try {
      this.isTransitioning = true;
      // console.log(
      //   'IMAGE_TIMER_DEBUG',
      //   'Starting media transition:',
      //   {
      //     fromIndex: this.currentQueueIndex,
      //     nextIndex: (this.currentQueueIndex + 1) % this.playQueue.length,
      //     queueLength: this.playQueue.length
      //   }
      // );

      // Update cycle count
      currentItem.runCycleCount++;
      const response = await this.updateCampaignCycle(currentItem._id);

      // Calculate next index
      const nextIndex = (this.currentQueueIndex + 1) % this.playQueue.length;
      
      // Clean up current media
      await this.cleanupCurrentMedia();

      // Update index
      this.currentQueueIndex = nextIndex;

      // console.log(
      //   'IMAGE_TIMER_DEBUG',
      //   'Transition complete, playing next:',
      //   {
      //     nextIndex,
      //     nextMediaType: this.playQueue[nextIndex]?.mediaType,
      //     isTransitioning: this.isTransitioning
      //   }
      // );

      // Clear transitioning flag before playing next
      this.isTransitioning = false;

      // Play next item
      await this.playQueueItem(nextIndex);

    } catch (error) {
      console.log(
        'IMAGE_TIMER_DEBUG',
        'Error in timer completion:',
        {
          error,
          currentQueueIndex: this.currentQueueIndex,
          isTransitioning: this.isTransitioning
        }
      );
      
      this.isTransitioning = false;
      
      // Try to recover
      const nextIndex = (this.currentQueueIndex + 1) % this.playQueue.length;
      this.currentQueueIndex = nextIndex;
      await this.playQueueItem(nextIndex);
    }
  }

  private updateSubscriptionData(response: any) {
    if (!response?.data?.userId?.currentSubscription) return;

    const subscription = response.data.userId.currentSubscription;
    // console.log(
    //   'SUBSCRIPTION_UPDATE',
    //   'Received new subscription data:',
    //   {
    //     currentCycles: subscription.currentCycles,
    //     maxCycles: subscription.runCycleLimit,
    //     isCompleted: subscription.isCompleted
    //   }
    // );

    // If subscription is completed, remove all campaigns under this subscription
    if (subscription.isCompleted) {
      const subscriptionId = subscription._id;
      
      // Remove from campaigns array
      this.campaigns = this.campaigns.filter((camp) => {
        const campSubId = camp.userId?.currentSubscription?._id;
        return campSubId !== subscriptionId;
      });

      // Remove from play queue
      const oldQueueLength = this.playQueue.length;
      this.playQueue = this.playQueue.filter(item => {
        const itemSubId = item.userId?.currentSubscription?._id;
        return itemSubId !== subscriptionId;
      });

      // console.log(
      //   'SUBSCRIPTION_UPDATE',
      //   'Removed completed subscription campaigns:',
      //   {
      //     subscriptionId,
      //     removedFromQueue: oldQueueLength - this.playQueue.length,
      //     remainingInQueue: this.playQueue.length
      //   }
      // );

      // Reset queue index if needed
      if (this.playQueue.length === 0) {
        this.currentQueueIndex = 0;
        this.currentMedia = null;
        this.noMediaMessage = 'No more campaigns available to play';
        return;
      } else if (this.currentQueueIndex >= this.playQueue.length) {
        this.currentQueueIndex = 0;
      }

      // Play next available campaign if needed
      if (!this.currentMedia) {
        this.playQueueItem(this.currentQueueIndex);
      }

      return;
    }

    // Update subscription data for all campaigns from same subscription
    this.playQueue.forEach(item => {
      if (item.userId?.currentSubscription?._id === subscription._id) {
        if (item.userId && item.userId.currentSubscription) {
          item.userId.currentSubscription.currentCycles = subscription.currentCycles;
          item.userId.currentSubscription.isCompleted = subscription.isCompleted;
        }
      }
    });

    // Update warnings after subscription update
    this.updateWarnings();
  }

  private async updateCampaignCycle(campaignId: string): Promise<any> {
    try {
      const currentLocation = this.locationStack[this.locationStack.length - 1];
      if (!currentLocation) return null;

      const currentItem = this.playQueue[this.currentQueueIndex];
      console.log(
        'CYCLE_UPDATE',
        'Starting cycle update:',
        {
          campaignId,
          campaignName: currentItem?.campaignName,
          currentCycles: currentItem?.runCycleCount,
          subscriptionCycles: currentItem?.userId?.currentSubscription?.currentCycles
        }
      );

      const response = await this.campaignService.updateCampaignCycleAndLocation(
        campaignId,
        currentLocation
      ).toPromise();

      // Update subscription data
      this.updateSubscriptionData(response);

      this.locationStack = [];
      return response;

    } catch (error) {
      console.log('CYCLE_UPDATE', 'Error updating cycle:', error);
      return null;
    }
  }

  private updateWarnings() {
    console.log(
      'WARNING_UPDATE',
      'Starting warning update',
      {
        queueSize: this.playQueue.length,
        campaigns: this.playQueue.map(item => ({
          name: item.campaignName,
          cycles: `${item.runCycleCount}/${item.maxRunCycleLimit}`,
          subscriptionCycles: item.userId?.currentSubscription?.currentCycles
        }))
      }
    );

    // Clear existing warnings
    this.warningMap.clear();

    // Group campaigns by subscription
    const subscriptionGroups = new Map<string, QueueItem[]>();
    this.playQueue.forEach(item => {
      const subId = item.userId?.currentSubscription?._id;
      if (subId) {
        if (!subscriptionGroups.has(subId)) {
          subscriptionGroups.set(subId, []);
        }
        subscriptionGroups.get(subId)!.push(item);
      }
    });

    // Update warnings for each subscription group
    subscriptionGroups.forEach((campaigns, subId) => {
      const subscription = campaigns[0].userId?.currentSubscription;
      if (!subscription) return;

      const remainingCycles = subscription.runCycleLimit - subscription.currentCycles;
      const shouldWarn = remainingCycles <= 5 && remainingCycles > 0;

      campaigns.forEach(campaign => {
        const state = { show: shouldWarn, remainingCycles };
        this.warningMap.set(campaign._id, state);

        console.log(
          'WARNING_UPDATE',
          'Campaign warning state updated:',
          {
            campaignName: campaign.campaignName,
            subscriptionCycles: subscription.currentCycles,
            maxCycles: subscription.runCycleLimit,
            remainingCycles,
            shouldShow: shouldWarn
          }
        );
      });
    });
  }

  // Add map-related methods
  private loadGoogleMaps(): Promise<void> {
    return new Promise((resolve, reject) => {
      
      const apiKey = environment.googleMapsApiKey;
      
      if (window.google) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        resolve();
      };
      
      script.onerror = (error) => {
        console.log(this.SOURCE, 'Failed to load Google Maps script', error);
        reject(error);
      };

      document.head.appendChild(script);
    });
  }

  private loadCampaignLocations(): void {
    try {
      // Use the same campaigns that are being used for video playback
      const playableCampaigns = this.campaigns;

      if (!playableCampaigns.length || !this.googleMap?.googleMap) {
        return;
      }

      const googleMap = this.googleMap.googleMap;
      
      playableCampaigns.forEach(campaign => {

        if (!campaign.selectedLocations?.length) return;

        campaign.selectedLocations.forEach(location => {
          const position = {
            lat: location.latitude,
            lng: location.longitude
          };

          const marker = new google.maps.Marker({
            position: position,
            map: googleMap,
            title: location.locationName,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: '#eb7641',
              fillOpacity: 0.4,
              strokeColor: '#eb7641',
              strokeWeight: 2
            }
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 15px; min-width: 200px;">
                <h3 style="color: #eb7641; margin-bottom: 8px; font-weight: 600;">
                  <strong style="color: #374151;">Location:</strong> ${location.locationName}
                </h3>
                <p style="margin: 0; color: #4B5563; font-size: 14px;">
                  <strong style="color: #374151;">Campaign:</strong> ${campaign.campaignName}
                </p>
              </div>
            `
          });

          infoWindow.open(googleMap, marker);

          this.markers.push(marker);
          this.infoWindows.push(infoWindow);

          marker.addListener('click', () => {
            this.infoWindows.forEach(iw => iw.close());
            infoWindow.open(googleMap, marker);
          });
        });
      });

      if (this.markers.length > 0) {

        const bounds = new google.maps.LatLngBounds();
        this.markers.forEach(marker => bounds.extend(marker.getPosition()!));
        googleMap.fitBounds(bounds);
      } else {
      }
    } catch (error) {
      console.log(
        'MAP_INIT',
        'Error loading campaign locations:',
        error
      );
    }
  }

  private updateCurrentLocation(location: any): void {
    if (!this.googleMap?.googleMap) return;

    const position = {
      lat: location.latitude,
      lng: location.longitude
    };

    if (!this.currentLocationMarker) {
      this.currentLocationMarker = new google.maps.Marker({
        position: position,
        map: this.googleMap.googleMap,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        },
        title: 'Current Location',
        zIndex: 999
      });

      const pulseEffect = () => {
        const icon = this.currentLocationMarker?.getIcon() as google.maps.Symbol;
        if (icon) {
          icon.scale = icon.scale === 10 ? 12 : 10;
          icon.fillOpacity = icon.scale === 10 ? 1 : 0.7;
          this.currentLocationMarker?.setIcon(icon);
        }
        setTimeout(pulseEffect, 1000);
      };
      pulseEffect();
    } else {
      this.currentLocationMarker.setPosition(position);
    }
  }

  private async updateOptimalRoute(): Promise<void> {
    if (!this.currentLocationMarker || !this.markers.length || !this.googleMap?.googleMap) {
      return;
    }

    // Clear existing route
    if (this.currentPolyline) {
      this.currentPolyline.setMap(null);
    }

    const currentPos = this.currentLocationMarker.getPosition()!;
    const locations = this.markers.map(marker => marker.getPosition()!);

    // Find optimal route using circular repeating route pattern
    const route = await this.calculateOptimalRoute(currentPos, locations);

    if (route && route.length > 1) {
      try {
        // Prepare Routes API request
        const routesRequest = {
          origin: {
            location: {
              latLng: { latitude: route[0].lat(), longitude: route[0].lng() }
            }
          },
          destination: {
            location: {
              latLng: { latitude: route[route.length - 1].lat(), longitude: route[route.length - 1].lng() }
            }
          },
          intermediates: route.slice(1, -1).map(point => ({
            location: {
              latLng: { latitude: point.lat(), longitude: point.lng() }
            }
          })),
          travelMode: 'DRIVE',
          optimizeWaypointOrder: true,
          routingPreference: 'TRAFFIC_AWARE',
          languageCode: 'en',
          units: 'METRIC'
        };

        // Make HTTP request to Routes API
        const response = await this.http.post<any>(
          'https://routes.googleapis.com/directions/v2:computeRoutes',
          routesRequest,
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': environment.googleMapsApiKey,
              'X-Goog-FieldMask': 'routes.polyline.encodedPolyline,routes.optimizedIntermediateWaypointIndex'
            }
          }
        ).toPromise();

        if (response?.routes?.length > 0) {
          const encodedPolyline = response.routes[0].polyline.encodedPolyline;
          const path = google.maps.geometry.encoding.decodePath(encodedPolyline);

          // Create a new polyline
          this.currentPolyline = new google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: '#4285F4', // Google Maps blue color
            strokeOpacity: 1,
            strokeWeight: 6,
            map: this.googleMap!.googleMap!,
            zIndex: 1 // Keep route below markers but above map
          });

          // Add a white outline to make the route stand out
          const outlinePolyline = new google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: '#FFFFFF',
            strokeOpacity: 1,
            strokeWeight: 8,
            map: this.googleMap!.googleMap!,
            zIndex: 0 // Keep outline below main route
          });

          // Fit bounds to show the entire route
          const bounds = new google.maps.LatLngBounds();
          path.forEach(point => bounds.extend(point));
          this.googleMap!.googleMap!.fitBounds(bounds);
        } else {
          this.drawSimpleRoute(route);
        }
      } catch (error) {
        console.log(
          'MAP_ROUTE',
          'Error in Routes API request, falling back to simple route',
          { error }
        );
        this.drawSimpleRoute(route);
      }
    } else {
    }
  }

  private calculateOptimalRoute(
    start: google.maps.LatLng,
    destinations: google.maps.LatLng[]
  ): Promise<google.maps.LatLng[]> {
    return new Promise((resolve) => {
      const route: google.maps.LatLng[] = [start];
      const unvisited = [...destinations];

      let nearestIdx = 0;
      let minDistance = this.calculateDistance(
        start.lat(),
        start.lng(),
        unvisited[0].lat(),
        unvisited[0].lng()
      );

      for (let i = 1; i < unvisited.length; i++) {
        const distance = this.calculateDistance(
          start.lat(),
          start.lng(),
          unvisited[i].lat(),
          unvisited[i].lng()
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestIdx = i;
        }
      }

      const orderedPoints = [unvisited[nearestIdx]];
      unvisited.splice(nearestIdx, 1);

      while (unvisited.length > 0) {
        const current = orderedPoints[orderedPoints.length - 1];
        nearestIdx = 0;
        minDistance = this.calculateDistance(
          current.lat(),
          current.lng(),
          unvisited[0].lat(),
          unvisited[0].lng()
        );

        for (let i = 1; i < unvisited.length; i++) {
          const distance = this.calculateDistance(
            current.lat(),
            current.lng(),
            unvisited[i].lat(),
            unvisited[i].lng()
          );
          if (distance < minDistance) {
            minDistance = distance;
            nearestIdx = i;
          }
        }

        orderedPoints.push(unvisited[nearestIdx]);
        unvisited.splice(nearestIdx, 1);
      }

      route.push(...orderedPoints);
      route.push(start);
      route.push(...orderedPoints);
      route.push(start);

      resolve(route);
    });
  }

  private drawSimpleRoute(route: google.maps.LatLng[]): void {
    if (!this.googleMap?.googleMap) return;

    if (this.currentPolyline) {
      this.currentPolyline.setMap(null);
    }

    const outlinePolyline = new google.maps.Polyline({
      path: route,
      geodesic: true,
      strokeColor: '#FFFFFF',
      strokeOpacity: 1,
      strokeWeight: 8,
      map: this.googleMap.googleMap,
      zIndex: 0
    });

    this.currentPolyline = new google.maps.Polyline({
      path: route,
      geodesic: true,
      strokeColor: '#4285F4',
      strokeOpacity: 1,
      strokeWeight: 6,
      map: this.googleMap.googleMap,
      zIndex: 1
    });

    const bounds = new google.maps.LatLngBounds();
    route.forEach(point => bounds.extend(point));
    this.googleMap.googleMap.fitBounds(bounds);
  }

  // Add view toggle method
  toggleView(): void {
    this.showMap = !this.showMap;
    if (this.showMap) {
      // Add logging to track initialization

      if (!this.isGoogleMapsLoaded) {
        this.loadGoogleMaps().then(() => {
          this.isGoogleMapsLoaded = true;
          this.initializeMap();
        });
      } else {
        this.initializeMap();
      }

      // Start route update timer when showing map
      this.startRouteUpdateTimer();
    } else {
      // Clear timer when hiding map
      this.clearRouteUpdateTimer();
    }
  }

  private initializeMap(): void {
    // Add delay to ensure map is properly mounted
    setTimeout(() => {
      if (this.googleMap?.googleMap) {

        this.routesService = new google.maps.DirectionsService();
        
        // Clear existing markers and info windows
        this.markers.forEach(marker => marker.setMap(null));
        this.infoWindows.forEach(window => window.close());
        this.markers = [];
        this.infoWindows = [];
        
        // Load campaign locations
        this.loadCampaignLocations();
        
        // Update current location and route if available
        const lastLocation = this.locationStack[this.locationStack.length - 1];
        if (lastLocation) {
          this.updateCurrentLocation(lastLocation);
          this.updateOptimalRoute();
        }
      } else {
      }
    }, 1000);
  }

  // Add timer methods
  private startRouteUpdateTimer(): void {
    
    // Clear any existing timer first
    this.clearRouteUpdateTimer();
    
    // Set new timer to reinitialize map every 10 seconds
    this.routeUpdateTimer = setInterval(() => {
      // Reinitialize the entire map
      this.initializeMap();
    }, 10000); // 10 seconds
  }

  private clearRouteUpdateTimer(): void {
    if (this.routeUpdateTimer) {
      clearInterval(this.routeUpdateTimer);
      this.routeUpdateTimer = null;
    }
  }

  // Add these methods to the component class
  shouldShowWarning(item: QueueItem): boolean {
    console.log(
      'WARNING_CHECK',
      'Starting warning evaluation:',
      {
        campaignName: item.campaignName,
        campaignCycles: `${item.runCycleCount}/${item.maxRunCycleLimit}`,
        subscriptionData: {
          currentCycles: item.userId?.currentSubscription?.currentCycles,
          maxCycles: item.userId?.currentSubscription?.runCycleLimit
        }
      }
    );

    if (!item.userId?.currentSubscription) {
      console.log(
        'WARNING_CHECK',
        'No subscription data found',
        { campaignName: item.campaignName }
      );
      return false;
    }

    const subscription = item.userId.currentSubscription;
    const remainingCycles = subscription.runCycleLimit - subscription.currentCycles;

    console.log(
      'WARNING_CHECK',
      'Warning calculation:',
      {
        campaignName: item.campaignName,
        subscriptionCurrentCycles: subscription.currentCycles,
        subscriptionMaxCycles: subscription.runCycleLimit,
        remainingCycles,
        shouldShow: remainingCycles <= 5 && remainingCycles > 0
      }
    );

    return remainingCycles <= 5 && remainingCycles > 0;
  }

  getSubscriptionRemainingCycles(item: QueueItem): number {
    console.log(
      'CYCLES_DEBUG',
      'Remaining cycles calculation triggered:',
      {
        campaignName: item.campaignName,
        triggerSource: new Error().stack?.split('\n')[2] // Get caller
      }
    );

    if (!item.userId?.currentSubscription) {
      console.log(
        'CYCLES_DEBUG',
        'No subscription found:',
        { campaignName: item.campaignName }
      );
      return 0;
    }
    
    const subscription = item.userId.currentSubscription;
    const totalCyclesUsed = subscription.currentCycles;
    const maxCycles = subscription.runCycleLimit;
    
    console.log(
      'CYCLES_DEBUG',
      'Cycles calculation result:',
      {
        campaignName: item.campaignName,
        totalCyclesUsed,
        maxCycles,
        remaining: Math.max(0, maxCycles - totalCyclesUsed)
      }
    );
    
    return Math.max(0, maxCycles - totalCyclesUsed);
  }

  // Update the template binding
  getWarningState(item: QueueItem): {show: boolean, remainingCycles: number} {
    const cached = this.warningMap.get(item._id);
    if (cached) {
      return cached;
    }

    if (!item.userId?.currentSubscription) {
      return { show: false, remainingCycles: 0 };
    }

    const subscription = item.userId.currentSubscription;
    const remainingCycles = subscription.runCycleLimit - subscription.currentCycles;
    const state = {
      show: remainingCycles <= 5 && remainingCycles > 0,
      remainingCycles
    };

    this.warningMap.set(item._id, state);
    return state;
  }
}
