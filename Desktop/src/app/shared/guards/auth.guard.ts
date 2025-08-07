import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/Auth/Auth.service';
import { LoggingService } from '../services/logging.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private loggingService: LoggingService
  ) {}

  async canActivate(): Promise<boolean> {
    const accessToken = this.authService.getAccessToken();
    const refreshToken = this.authService.getRefreshToken();
    if (!accessToken || !refreshToken) {
      this.router.navigate(['/login']);
      return false;
    }

    try {
      const isValid = await firstValueFrom(
        this.authService.verifyToken(accessToken, refreshToken)
      );
      if (isValid) {
        return true;
      }
      this.router.navigate(['/login']);
      return false;
    } catch (error) {
      this.router.navigate(['/login']);
      return false;
    }
  }
}
