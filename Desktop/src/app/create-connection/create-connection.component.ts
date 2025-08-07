import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ElectronService } from '../shared/services/electron/electron.service';
import { Subscription, interval } from 'rxjs';
import { takeWhile, switchMap } from 'rxjs/operators';
import { CampaignService } from '../shared/services/campaigns/campaign.service';
import { LoggingService } from '../shared/services/logging.service';
import { AuthService } from '../shared/services/Auth/Auth.service';
import { SpinnerComponent } from '../shared/components/spinner/spinner.component';
import { NavbarComponent } from '../shared/components/navbar/navbar.component';


interface LocationUpdate {
  timestamp: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  bearing: number | null;
  accuracy: number | null;
}

@Component({
  selector: 'app-create-connection',
  standalone: true,
  imports: [RouterLink, CommonModule, SpinnerComponent, NavbarComponent],
  templateUrl: './create-connection.component.html',
  styleUrls: ['./create-connection.component.css']
})
export class CreateConnectionComponent implements OnInit, OnDestroy {
  isConnected: boolean = false;
  connectionStatus: string = 'Disconnected';
  serverIp: string = '';
  serverPort: any = 8083;
  errorMessage: string = '';
  showConsole: boolean = true;
  latestLocationUpdate: LocationUpdate | null = null;
  isNewUpdate: boolean = false;
  private locationSubscription: Subscription | null = null;
  private alive: boolean = true;
  private socketTestSubscription: Subscription | null = null;
  lastTestEvent: any = null;
  testEventCount: number = 0;

  constructor(private electronService: ElectronService, private ngZone: NgZone, private campaignService: CampaignService, private loggingService: LoggingService, private authService: AuthService) {}

  ngOnInit() {
    this.getServerIp();
    this.connectTraccar();
  }

  ngOnDestroy() {
    this.alive = false;
    if (this.locationSubscription) {
      this.locationSubscription.unsubscribe();
    }
    if (this.socketTestSubscription) {
      this.socketTestSubscription.unsubscribe();
    }
  }

  async toggleConnection() {
    if (this.isConnected) {
      await this.disconnectTraccar();
    } else {
      await this.connectTraccar();
    }
  }

  private async connectTraccar() {
    try {
      const result = await this.electronService.connectTraccar();
      if (result.success) {
        this.startLocationUpdates();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      this.errorMessage = 'Failed to connect. Please try again.';
    }
  }

  private async disconnectTraccar() {
    try {
      const result = await this.electronService.disconnectTraccar();
      if (result.success) {
        this.isConnected = false;
        this.connectionStatus = 'Disconnected';
        this.stopLocationUpdates();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      this.errorMessage = 'Failed to disconnect. Please try again.';
    }
  }

  private startLocationUpdates() {
    this.locationSubscription = this.electronService.onLocationUpdate()
      .pipe(
        takeWhile(() => this.alive)
      )
      .subscribe(
        (update: any) => {
          this.ngZone.run(() => {
            this.latestLocationUpdate = update;
            this.isConnected = true;
            this.connectionStatus = 'Connected';
            this.isNewUpdate = true;
            setTimeout(() => {
              this.isNewUpdate = false;
            }, 100); // Reduced from 2000ms to 100ms for quicker visual feedback
          });
          this.handleLocationUpdate(update);
        },
        (error: any) => {
        }
      );
  }

  private stopLocationUpdates() {
    if (this.locationSubscription) {
      this.locationSubscription.unsubscribe();
      this.locationSubscription = null;
    }
  }

  private async getServerIp() {
    try {
      const ip = await this.electronService.getServerIp();
      this.serverIp = ip;
    } catch (error: any) {
      this.errorMessage = 'Failed to get server IP. Please check your network connection.';
    }
  }

  toggleConsole() {
    this.showConsole = !this.showConsole;
  }

  private handleLocationUpdate(location: LocationUpdate) {
    this.campaignService.setCurrentLocation({
      latitude: location.latitude,
      longitude: location.longitude
    });
  }

  closeWindow() {
    this.electronService.closeWindow();
  }

  minimizeWindow() {
    this.electronService.minimizeWindow();
  }

}
