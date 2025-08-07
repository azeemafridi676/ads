import { Component, OnInit } from '@angular/core';
import { WindowService } from '../services/window.service';
import { LoggingService } from '../shared/services/logging.service';

@Component({
  selector: 'app-external',
  template: `
    <div class="external-display">
      <div class="video-container">
        <!-- Your video element will go here -->
      </div>
    </div>
  `,
  styles: [`
    .external-display {
      width: 100vw;
      height: 100vh;
      background: black;
      overflow: hidden;  /* Ensures no scrollbars appear */
      position: relative; /* Add this to make it a positioning context */
    }

    .video-container {
      width: 100%;
      height: 100%;
      position: relative;
    }

    .video-element {
      width: 100%;
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%); /* This centers the element both horizontally and vertically */
      object-fit: cover;
      min-width: 100%;
      min-height: 100%;
    }
  `]
})
export class ExternalComponent implements OnInit {
  constructor(
    private windowService: WindowService,
    private loggingService: LoggingService
  ) {}

  ngOnInit() {
  }
} 