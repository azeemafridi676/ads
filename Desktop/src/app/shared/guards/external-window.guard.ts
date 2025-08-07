import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { ElectronService } from '../services/electron/electron.service';
import { LoggingService } from '../services/logging.service';

@Injectable({
  providedIn: 'root'
})
export class ExternalWindowGuard implements CanActivate {
  private SOURCE = "external-window.guard.ts";
  constructor(
    private electronService: ElectronService,
    private router: Router,
    private loggingService: LoggingService
  ) {}

  async canActivate(): Promise<boolean> {
    try {
      const windowType = await this.electronService.getWindowType();
      if (windowType === 'external') {
        return true;
      }
      
      // If not external window, redirect to login
      this.router.navigate(['/login']);
      return false;
    } catch (error) {
      this.loggingService.log(this.SOURCE, 'Error in external window guard:', error);
      return false;
    }
  }
} 