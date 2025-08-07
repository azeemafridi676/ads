import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WelcomePageComponent } from './welcome-page/welcome-page.component';
import { CreateConnectionComponent } from './create-connection/create-connection.component';
import { DownloadSelectPageComponent } from './download-select-page/download-select-page.component';
import { DownloadStatusPageComponent } from './download-status-page/download-status-page.component';
import { VideoPlayPageComponent } from './video-play-page/video-play-page.component';
import { AuthGuard } from './shared/guards/auth.guard';
import { LoginComponent } from './Auth/login/login.component';
import { SignupComponent } from './Auth/signup/signup.component';
import { ForgetPasswordComponent } from './Auth/forget-password/forget-password.component';
import { OtpComponent } from './Auth/otp/otp.component';
import { ResetPasswordComponent } from './Auth/reset-password/reset-password.component';
import { PublicGuard } from './shared/guards/public.guard';
import { ExternalComponent } from './external/external.component';
import { ExternalDisplayComponent } from './external/external-display.component';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { ExternalWindowGuard } from './shared/guards/external-window.guard';
import { inject } from '@angular/core';
import { ElectronService } from './shared/services/electron/electron.service';
import { Router } from '@angular/router';
import { LoggingService } from './shared/services/logging.service';
import { MapPreviewPageComponent } from './map-preview-page/map-preview-page.component';
import { ScreenSelectorComponent } from './screen-selector/screen-selector.component';

const routes: Routes = [
  // External display route
  {
    path: 'external-display',
    component: ExternalDisplayComponent,
    canActivate: [ExternalWindowGuard],
    data: { isExternal: true }
  },

  // Public routes
  { 
    path: 'login', 
    component: LoginComponent,
    canActivate: [PublicGuard]
  },
  { 
    path: 'signup', 
    component: SignupComponent,
    canActivate: [PublicGuard]
  },
  { 
    path: 'forgot-password', 
    component: ForgetPasswordComponent,
    canActivate: [PublicGuard]
  },
  { 
    path: 'otp', 
    component: OtpComponent,
    canActivate: [PublicGuard]
  },
  { 
    path: 'reset-password', 
    component: ResetPasswordComponent,
    canActivate: [PublicGuard]
  },
  
  // Protected routes
  {
    path: 'app',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'create-connection',
        pathMatch: 'full'
      },
      {
        path: 'screen-selector',
        component: ScreenSelectorComponent
      },
      {
        path: 'create-connection',
        component: CreateConnectionComponent
      },
      {
        path: 'welcome',
        component: WelcomePageComponent
      },
      {
        path: 'download-select',
        component: DownloadSelectPageComponent
      },
      {
        path: 'download-status',
        component: DownloadStatusPageComponent
      },
      {
        path: 'map-preview',
        component: MapPreviewPageComponent
      },
      {
        path: 'video-play',
        component: VideoPlayPageComponent
      }
    ]
  },

  // Default route
  {
    path: '',
    redirectTo: 'app/create-connection',
    pathMatch: 'full'
  },

  // Catch-all route
  {
    path: '**',
    redirectTo: 'app/create-connection'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    useHash: true,
    enableTracing: true  // Add this for detailed route debugging
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }