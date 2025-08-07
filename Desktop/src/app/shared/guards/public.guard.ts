import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/Auth/Auth.service';
import { Observable, of } from 'rxjs';
import { LoggingService } from '../services/logging.service';
import { map } from 'rxjs/operators';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PublicGuard implements CanActivate {
  constructor(
    private authService: AuthService, 
    private router: Router,
    private loggingService: LoggingService
  ) {}

  async canActivate(): Promise<boolean> {
    const accessToken = this.authService.getAccessToken();
    const refreshToken = this.authService.getRefreshToken();

    if (accessToken && refreshToken) {
      try {
        const isValid = await firstValueFrom(
          this.authService.verifyToken(accessToken, refreshToken)
        );

        if (isValid) {
          this.router.navigate(['/app/create-connection']);
          return false;
        }
      } catch (error) {
      }
    }

    return true;
  }
} 