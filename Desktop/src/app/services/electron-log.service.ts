import { Injectable } from '@angular/core';
import { LoggingService } from '../shared/services/logging.service';

@Injectable({
  providedIn: 'root'
})
export class ElectronLogService {
  private isProcessingLog = false;
  private SOURCE = "electron-log.service.ts";

  constructor(private loggingService: LoggingService) {
    try {
      if (!(window as any).electronAPI) {
        return;
      }

      (window as any).electronAPI.onMainProcessLog((log: any) => {
        if (!this.isProcessingLog) {
          this.isProcessingLog = true;
          this.loggingService.log(log.source, log.message);
          this.isProcessingLog = false;
        }
      });
      
    } catch (error) {
      this.loggingService.log(this.SOURCE, 'Error setting up main process logging:', error);
    }
  }
}