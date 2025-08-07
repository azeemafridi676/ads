import { Component, OnInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoggingService } from '../shared/services/logging.service';

@Component({
  selector: 'app-external-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="external-display">
      <!-- Video Element -->
      <div class="media-container">
        <video #videoElement
               class="media-element"
               autoplay
               loop
               [style.display]="currentMediaType === 'video' ? 'block' : 'none'"
               (loadeddata)="onVideoLoaded()"
               (ended)="onVideoEnded()"
               (error)="onVideoError($event)">
        </video>

        <!-- Image Element -->
        <img *ngIf="currentMediaType === 'image'"
             [src]="currentUrl"
             class="media-element"
             (load)="onImageLoaded()"
             (error)="onImageError($event)">
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      background: #000;
      overflow: hidden;
    }

    .external-display {
      width: 100%;
      height: 100%;
      position: relative;
    }

    .media-container {
      width: 100%;
      height: 100%;
      position: relative;
      overflow: hidden;
    }

    .media-element {
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 100% !important;
      height: 100% !important;
      object-fit: fill;
    }
  `]
})
export class ExternalDisplayComponent implements OnInit {
  @ViewChild('videoElement', { static: true }) videoElement!: ElementRef<HTMLVideoElement>;
  currentUrl: string | null = null;
  currentMediaType: 'video' | 'image' | null = null;
  private SOURCE = "external-display.component.ts";

  constructor(
    private loggingService: LoggingService,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    try {
      if (!(window as any).electronAPI) {
        return;
      }

      (window as any).electronAPI.onSyncUpdate((update: any) => {
        this.ngZone.run(() => {
          this.handleMediaUpdate(update);
        });
      });

    } catch (error) {
      this.loggingService.log(this.SOURCE + ' : ngOnInit', 'Error in ngOnInit:', error);
    }
  }

  private handleMediaUpdate(update: any) {
    if (!this.videoElement) {
      return;
    }

    try {
      switch(update.type) {
        case 'loadVideo':
          this.currentUrl = update.url;
          // Use the mediaType from the update instead of checking file extension
          this.currentMediaType = update.mediaType || 'video';
          if (this.currentMediaType === 'video') {
            const video = this.videoElement.nativeElement;
            video.src = this.currentUrl || '';
            if (update.autoplay) {
              video.play().catch(err => 
                this.loggingService.log(this.SOURCE + ' : handleMediaUpdate', 'Autoplay failed:', err)
              );
            }
          }
          break;
          
        case 'play':
          if (this.currentMediaType === 'video') {
            this.videoElement.nativeElement.play().catch(err => 
              this.loggingService.log(this.SOURCE + ' : handleMediaUpdate', 'Play failed:', err)
            );
          }
          break;
          
        case 'pause':
          if (this.currentMediaType === 'video') {
            this.videoElement.nativeElement.pause();
          }
          break;
          
        case 'seek':
          if (this.currentMediaType === 'video') {
            this.videoElement.nativeElement.currentTime = update.time;
          }
          break;
          
        case 'volume':
          if (this.currentMediaType === 'video') {
            const video = this.videoElement.nativeElement;
            video.muted = update.muted;
            video.volume = update.level;
          }
          break;

        case 'clearMedia':
          // Clear current media
          if (this.currentMediaType === 'video' && this.videoElement?.nativeElement) {
            const video = this.videoElement.nativeElement;
            video.pause();
            video.removeAttribute('src');
            video.load();
          }
          this.currentUrl = null;
          this.currentMediaType = null;
          break;

        case 'ended':
          if (this.currentMediaType === 'video' && this.videoElement.nativeElement.loop) {
            this.videoElement.nativeElement.currentTime = 0;
            this.videoElement.nativeElement.play().catch(err => 
              this.loggingService.log(this.SOURCE + ' : handleMediaUpdate', 'Loop replay failed:', err)
            );
          }
          break;
      }
    } catch (error) {
      this.loggingService.log(this.SOURCE + ' : handleMediaUpdate', 'Error handling update:', error);
    }
  }

  onVideoLoaded() {
    if (this.currentMediaType === 'video') {
      this.videoElement.nativeElement.play().catch(err => 
        this.loggingService.log(this.SOURCE + ' : onVideoLoaded', 'Play after load failed:', err)
      );
    }
  }

  onImageLoaded() {
  }

  onVideoError(error: any) {
    this.loggingService.log(this.SOURCE + ' : onVideoError', 'Video error:', error);
  }

  onImageError(error: any) {
    this.loggingService.log(
      this.SOURCE + ' : onImageError', 
      'Image error:', 
      {
        error,
        currentUrl: this.currentUrl,
        currentMediaType: this.currentMediaType
      }
    );
  }

  onVideoEnded() {
    if (this.currentMediaType === 'video' && this.videoElement.nativeElement.loop) {
      this.videoElement.nativeElement.play().catch(err => 
        this.loggingService.log(this.SOURCE + ' : onVideoEnded', 'Loop replay failed:', err)
      );
    }
  }
} 