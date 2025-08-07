import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ElectronService, Display } from '../shared/services/electron/electron.service';
import { NavbarComponent } from '../shared/components/navbar/navbar.component';
import { LoggingService } from '../shared/services/logging.service';

interface DisplayWithResolution extends Display {
  physicalResolution: {
    width: number;
    height: number;
  };
  thumbnail?: string;
}

@Component({
  selector: 'app-screen-selector',
  standalone: true,
  imports: [CommonModule, RouterLink, NavbarComponent],
  templateUrl: './screen-selector.component.html',
  styleUrl: './screen-selector.component.css'
})
export class ScreenSelectorComponent implements OnInit, OnDestroy {
  displays: DisplayWithResolution[] = [];
  selectedDisplay: DisplayWithResolution | null = null;
  error: string | null = null;
  private thumbnailInterval: any;

  constructor(private electronService: ElectronService, private loggingService: LoggingService) {}

  ngOnInit() {
    this.loadDisplays();
    // Update thumbnails every 2 seconds
    this.thumbnailInterval = setInterval(() => this.updateThumbnails(), 2000);
  }

  ngOnDestroy() {
    if (this.thumbnailInterval) {
      clearInterval(this.thumbnailInterval);
    }
  }

  async loadDisplays() {
    try {
      const rawDisplays = await this.electronService.getDisplays();
      
      // Add physical resolution to each display
      this.displays = rawDisplays.map(display => ({
        ...display,
        physicalResolution: {
          width: Math.round(display.bounds.width * display.scaleFactor),
          height: Math.round(display.bounds.height * display.scaleFactor)
        }
      }));

      // Get initial thumbnails
      await this.updateThumbnails();


      
      if (this.displays.length > 0) {
        this.selectDisplay(this.displays[0]);
      }
    } catch (error: any) {
      this.error = error.message || 'Failed to load displays';
    }
  }

  private async updateThumbnails() {
    for (const display of this.displays) {
      try {
        // Try to get thumbnail using display ID first
        let thumbnail = await this.electronService.getScreenThumbnail(display.id.toString());
        
        if (!thumbnail) {
          // Fallback to using index-based ID
          const displayIndex = this.displays.indexOf(display);
          thumbnail = await this.electronService.getScreenThumbnail(displayIndex.toString());
        }

        if (thumbnail) {
          display.thumbnail = thumbnail;
        }
      } catch (error) {
        
      }
    }
  }

  selectDisplay(display: DisplayWithResolution) {
    this.selectedDisplay = display;
    
    // Store the physical resolution in localStorage
    const displayConfig = {
      id: display.id,
      name: display.name,
      physicalResolution: {
        width: display.physicalResolution.width,
        height: display.physicalResolution.height
      },
      bounds: display.bounds,
      scaleFactor: display.scaleFactor
    };
    
    localStorage.setItem('selectedDisplay', JSON.stringify(displayConfig));
    
  }

  closeWindow() {
    this.electronService.closeWindow();
  }

  minimizeWindow() {
    this.electronService.minimizeWindow();
  }
}
