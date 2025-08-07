import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { AuthService } from './shared/services/Auth/Auth.service';
import { LoggingService } from './shared/services/logging.service';
import { ElectronLogService } from './services/electron-log.service';
import { filter } from 'rxjs/operators';
import { NavigationEnd } from '@angular/router';
import { ElectronService } from './shared/services/electron/electron.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <router-outlet></router-outlet>
  `,
  styles: []
})
export class AppComponent implements OnInit {
  title = 'Electron Angular App';

  constructor(
    private authService: AuthService, 
    private loggingService: LoggingService, 
    private router: Router,
    private electronService: ElectronService
  ) {
  }

  async ngOnInit() {
    const windowType = await this.electronService.getWindowType();
    if (windowType === 'external') {
      return;
    }

    const accessToken = this.authService.getAccessToken();
    const refreshToken = this.authService.getRefreshToken();
    if (!accessToken || !refreshToken) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const isValid = await firstValueFrom(
        this.authService.verifyToken(accessToken, refreshToken)
      );
      if (isValid) {
        this.router.navigate(['/app/create-connection']);
        return;
      }
    } catch (error) {
    }
    this.router.navigate(['/login']);

    // Log current route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
    });
  }
}