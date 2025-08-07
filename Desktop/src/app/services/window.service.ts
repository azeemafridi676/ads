import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { LoggingService } from '../shared/services/logging.service';

@Injectable({
  providedIn: 'root'
})
export class WindowService {
  private isExternalWindow = new BehaviorSubject<boolean>(false);
  isExternalWindow$ = this.isExternalWindow.asObservable();

  constructor(private loggingService: LoggingService) {
    // Check if this is the external window by looking at the URL hash
    try {
      const isExternal = window.location.hash.includes('external');
      this.isExternalWindow.next(isExternal);
    } catch (error) {
    }
  }

  isExternal(): boolean {
    return this.isExternalWindow.getValue();
  }
} 