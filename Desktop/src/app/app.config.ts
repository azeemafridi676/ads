import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { CampaignService } from './shared/services/campaigns/campaign.service';
import { ElectronService } from './shared/services/electron/electron.service';
import { AuthService } from './shared/services/Auth/Auth.service';
import { authInterceptor } from './shared/interceptor/auth.interceptor';
import { ElectronLogService } from './services/electron-log.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    CampaignService,
    ElectronService,
    AuthService,
    ElectronLogService
  ]
};
