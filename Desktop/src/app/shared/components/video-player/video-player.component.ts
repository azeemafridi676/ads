import { Component, OnInit, ViewChild, ElementRef, Input, OnDestroy, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoggingService } from '../../services/logging.service';
import { ElectronService } from '../../services/electron/electron.service';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="video-container" 
         (mousemove)="showControls()"
         (mouseleave)="hideControls = true">
      <div *ngIf="isLoading && !errorMessage" class="loading-overlay">
        <div class="spinner"></div>
      </div>

      <div *ngIf="errorMessage" class="error-overlay">
        <div class="error-message">
          {{ errorMessage }}
          <button (click)="retryLoad()">Retry</button>
        </div>
      </div>

      <video #videoElement 
             class="video-element"
             [src]="currentVideoUrl"
             [loop]="false"
             (loadeddata)="onVideoLoaded()"
             (loadstart)="isLoading = true"
             (ended)="onVideoEnded()"
             (error)="onVideoError($event)"
             (timeupdate)="onTimeUpdate()"
             (waiting)="isLoading = true"
             (playing)="isLoading = false">
        Your browser does not support the video tag.
      </video>
      
      <div class="controls" [class.hide-controls]="hideControls">
        <div class="progress-bar" 
             (mousedown)="startDragging($event)"
             (mousemove)="onDrag($event)"
             (mouseup)="stopDragging($event)"
             (mouseleave)="stopDragging($event)">
          <div class="progress" [style.width.%]="(currentTime / duration) * 100"></div>
          <div class="seek-handle" 
               [style.left.%]="(currentTime / duration) * 100">
          </div>
        </div>

        <div class="control-buttons">
          <button (click)="togglePlay()">{{ isPlaying ? 'Pause' : 'Play' }}</button>
          <button (click)="previousVideo()" [disabled]="!hasPrevious">Previous</button>
          <button (click)="nextVideo()" [disabled]="!hasNext">Next</button>
          
          <div class="volume-control">
            <button (click)="toggleMute()">{{ isMuted ? 'Unmute' : 'Mute' }}</button>
            <input type="range" 
                   min="0" 
                   max="1" 
                   step="0.1" 
                   [value]="volume"
                   (input)="onVolumeChange($event)">
          </div>

          <div class="playback-info">
            {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
          </div>

          <button (click)="toggleFullscreen()">
            {{ isFullscreen ? 'Exit Fullscreen' : 'Fullscreen' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .video-container {
      position: relative;
      width: 100%;
      height: 100%;
      background: #000;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .video-element {
      width: 100%;
      height: 100%;
      object-fit: contain;
      background: #000;
    }

    .controls {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
      padding: 20px 16px 12px;
      z-index: 2;
      transition: opacity 0.3s ease, transform 0.3s ease;
    }

    .controls.hide-controls {
      opacity: 0;
      transform: translateY(100%);
      pointer-events: none;
    }

    .progress-bar {
      width: 100%;
      height: 4px;
      background: rgba(255,255,255,0.2);
      cursor: pointer;
      position: relative;
      margin-bottom: 12px;
      border-radius: 2px;
      transition: height 0.2s ease;
    }

    .progress-bar:hover {
      height: 6px;
    }

    .progress {
      height: 100%;
      background: #eb7641;
      position: absolute;
      top: 0;
      left: 0;
      border-radius: 2px;
      transition: width 0.1s linear;
    }

    .seek-handle {
      position: absolute;
      top: 50%;
      width: 12px;
      height: 12px;
      background: #eb7641;
      border: 2px solid #fff;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    .progress-bar:hover .seek-handle {
      opacity: 1;
    }

    .control-buttons {
      display: flex;
      align-items: center;
      gap: 16px;
      color: white;
    }

    button {
      background: transparent;
      border: none;
      color: white;
      padding: 8px;
      cursor: pointer;
      border-radius: 4px;
      transition: background 0.2s;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    button:hover {
      background: rgba(255,255,255,0.1);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .volume-control {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    input[type="range"] {
      width: 80px;
      height: 4px;
      -webkit-appearance: none;
      background: rgba(255,255,255,0.2);
      border-radius: 2px;
      outline: none;
    }

    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 12px;
      height: 12px;
      background: #eb7641;
      border: 2px solid #fff;
      border-radius: 50%;
      cursor: pointer;
    }

    .playback-info {
      margin-left: auto;
      color: white;
      font-size: 14px;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 3;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255,255,255,0.3);
      border-top: 3px solid #eb7641;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 3;
    }

    .error-message {
      text-align: center;
      color: white;
      padding: 2rem;
    }

    .error-message button {
      margin-top: 1rem;
      padding: 8px 16px;
      background: #eb7641;
      border-radius: 4px;
    }

    .error-message button:hover {
      background: #d65b2b;
    }
  `]
})
export class VideoPlayerComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @Input() set videoPath(path: string) {
    if (path) {
      this.loadVideo(path);
    }
  }
  @Input() hasPrevious: boolean = false;
  @Input() hasNext: boolean = false;
  @Output() previousClicked = new EventEmitter<void>();
  @Output() nextClicked = new EventEmitter<void>();
  @Output() videoEnded = new EventEmitter<void>();
  @Output() videoError = new EventEmitter<any>();
  
  currentVideoUrl: string = '';
  isPlaying = false;
  isMuted = false;
  volume = 1;
  hideControls = true;
  currentTime = 0;
  duration = 0;
  private hideControlsTimeout: any;
  isLoading: boolean = false;
  isFullscreen = false;
  errorMessage: string | null = null;
  videoQuality: 'HD' | 'SD' | 'unknown' = 'unknown';
  private isDragging = false;
  private SOURCE = "video-player.component.ts";
  private fullscreenChangeHandler = () => {
    this.isFullscreen = !!document.fullscreenElement;
  };
  private preventAutoPause = true;

  constructor(
    private loggingService: LoggingService,
    private electronService: ElectronService
  ) {}

  async ngOnInit() {
    document.addEventListener('fullscreenchange', this.fullscreenChangeHandler);
    
    // Add visibility change logging
    document.addEventListener('visibilitychange', () => {
      // Prevent automatic pausing when visibility changes
      if (document.visibilityState === 'hidden' && this.preventAutoPause) {
        if (this.videoElement?.nativeElement) {
          this.videoElement.nativeElement.play().catch(error => {
            this.loggingService.log(
              'VIDEO_PLAYER',
              'Error resuming video after visibility change:',
              error
            );
          });
        }
      }
    });

  }

  ngOnDestroy() {
    if (this.hideControlsTimeout) {
      clearTimeout(this.hideControlsTimeout);
    }
    document.removeEventListener('fullscreenchange', this.fullscreenChangeHandler);
    
    // Add cleanup on destroy
    this.cleanup();
  }

  public cleanup() {
    if (this.videoElement?.nativeElement) {
      const video = this.videoElement.nativeElement;
      
      

      try {
        // Pause playback
        video.pause();
        
        // Remove source and load to clear buffer
        video.removeAttribute('src');
        video.load();
        
      
      } catch (error) {
        this.loggingService.log(
          'VIDEO_PLAYER',
          'Error during cleanup:',
          error
        );
      }
    }
  }

  async loadVideo(path: string) {
    try {
      // First cleanup existing video
      this.cleanup();
      
      this.isLoading = true;
      this.errorMessage = null;
      
      this.currentVideoUrl = path;
      
      if (this.videoElement?.nativeElement) {
        this.videoElement.nativeElement.src = this.currentVideoUrl;
        
        // Reset volume to previous state
        this.videoElement.nativeElement.volume = this.volume;
        this.videoElement.nativeElement.muted = this.isMuted;
        
        await this.videoElement.nativeElement.play();
        this.isPlaying = true;
      }
    } catch (error) {
      this.loggingService.log(
        this.SOURCE + ' : loadVideo', 
        'Error loading video:', 
        {
          error,
          path,
          currentUrl: this.currentVideoUrl
        }
      );
      this.errorMessage = 'Error loading video. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  onVideoLoaded() {
    this.errorMessage = null;
    const video = this.videoElement.nativeElement;
    this.videoQuality = video.videoHeight >= 720 ? 'HD' : 'SD';
    
    video.play().then(() => {
      this.isPlaying = true;
      this.syncAction({ type: 'play' });
    }).catch(error => {
      this.loggingService.log(this.SOURCE + ' : onVideoLoaded', 'Play failed:', error);
    });
  }

  onVideoEnded() {
   

    // Ensure cleanup before emitting end event
    this.cleanup();
    
    // Emit the end event
    this.videoEnded.emit();
  }

  onVideoError(event: any) {
    // Only handle real errors, not cleanup-related events
    if (this.videoElement?.nativeElement?.src) {
      this.loggingService.log(
        'VIDEO_PLAYER',
        'Video error occurred:',
        {
          error: event,
          src: this.videoElement.nativeElement.src
        }
      );
      this.videoError.emit(event);
    }
  }

  togglePlay() {
    const video = this.videoElement.nativeElement;
    if (video.paused) {
      video.play();
      this.isPlaying = true;
      this.syncAction({ type: 'play' });
    } else {
      video.pause();
      this.isPlaying = false;
      this.syncAction({ type: 'pause' });
    }
  }

  toggleMute() {
    const video = this.videoElement.nativeElement;
    video.muted = !video.muted;
    this.isMuted = video.muted;
    this.syncAction({ 
      type: 'volume', 
      muted: this.isMuted,
      level: this.volume 
    });
  }

  onVolumeChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.volume = parseFloat(value);
    this.videoElement.nativeElement.volume = this.volume;
    this.syncAction({ 
      type: 'volume',
      level: this.volume,
      muted: this.isMuted 
    });
  }

  previousVideo() {
    this.previousClicked.emit();
  }

  nextVideo() {
    this.nextClicked.emit();
  }

  onTimeUpdate() {
    const video = this.videoElement.nativeElement;
    this.currentTime = video.currentTime;
    this.duration = video.duration;
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  showControls() {
    this.hideControls = false;
    if (this.hideControlsTimeout) {
      clearTimeout(this.hideControlsTimeout);
    }
    this.hideControlsTimeout = setTimeout(() => {
      this.hideControls = true;
    }, 3000);
  }

  seek(event: MouseEvent) {
    this.updateSeekPosition(event);
  }

  async toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        await this.videoElement.nativeElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    switch(event.code) {
      case 'Space':
        event.preventDefault();
        this.togglePlay();
        break;
      case 'KeyM':
        this.toggleMute();
        break;
      case 'KeyF':
        this.toggleFullscreen();
        break;
      case 'ArrowLeft':
        this.seekRelative(-5); // 5 seconds back
        break;
      case 'ArrowRight':
        this.seekRelative(5);  // 5 seconds forward
        break;
    }
  }

  seekRelative(seconds: number) {
    const video = this.videoElement.nativeElement;
    const newTime = video.currentTime + seconds;
    video.currentTime = Math.max(0, Math.min(newTime, video.duration));
  }

  retryLoad() {
    this.errorMessage = null;
    this.loadVideo(this.videoPath);
  }

  startDragging(event: MouseEvent) {
    this.isDragging = true;
    this.updateSeekPosition(event);
  }

  onDrag(event: MouseEvent) {
    if (this.isDragging) {
      this.updateSeekPosition(event);
    }
  }

  stopDragging(event: MouseEvent) {
    if (this.isDragging) {
      this.updateSeekPosition(event);
      this.isDragging = false;
    }
  }

  updateSeekPosition(event: MouseEvent) {
    const progressBar = event.currentTarget as HTMLElement;
    const rect = progressBar.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const newTime = pos * this.duration;
    
    this.videoElement.nativeElement.currentTime = newTime;
    this.currentTime = newTime;
    this.syncAction({ type: 'seek', time: newTime });
  }

  @HostListener('window:mouseup')
  onWindowMouseUp() {
    this.isDragging = false;
  }

  @HostListener('window:mousemove', ['$event'])
  onWindowMouseMove(event: MouseEvent) {
    if (this.isDragging) {
      const progressBar = this.videoElement.nativeElement
        .parentElement
        ?.querySelector('.progress-bar') as HTMLElement;
      
      if (progressBar) {
        const rect = progressBar.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
        const newTime = pos * this.duration;
        
        this.videoElement.nativeElement.currentTime = newTime;
        this.currentTime = newTime;
      }
    }
  }

  private syncAction(action: any) {
    try {
      (window as any).electronAPI.syncVideoAction(action);
    } catch (error) {
      this.loggingService.log(this.SOURCE + ' : syncAction', 'Error sending action:', error);
    }
  }
} 