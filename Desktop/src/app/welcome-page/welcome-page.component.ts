import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ElectronService } from '../shared/services/electron/electron.service';
import { LoggingService } from '../shared/services/logging.service';

@Component({
  selector: 'app-welcome-page',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './welcome-page.component.html',
  styleUrls: ['./welcome-page.component.css']
})
export class WelcomePageComponent implements OnInit {
  showControls = false;
  hideTimeout: any;

  constructor(
    private electronService: ElectronService,
    private loggingService: LoggingService
  ) {
  }

  ngOnInit() {
    try {
      document.addEventListener('mousemove', this.handleMouseMove.bind(this));
      // Check window type
      this.electronService.getWindowType().then(type => {
      });

    } catch (error) {
    }
  }

  handleMouseMove(event: MouseEvent) {
    try {
      if (event.clientY < 50 && event.clientX > window.innerWidth - 100) {
        this.showControls = true;
        clearTimeout(this.hideTimeout);
        this.hideTimeout = setTimeout(() => {
          this.showControls = false;
        }, 5000);
      }
    } catch (error) {
    }
  }

  closeWindow() {
    this.electronService.closeWindow();
  }

  minimizeWindow() {
    this.electronService.minimizeWindow();
  }
}
