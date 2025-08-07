import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LoggingService } from '../logging.service';

export interface DownloadProgress {
  id: string;
  progress: number;
}

export interface Display {
  id: number;
  name: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  workArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  scaleFactor: number;
  rotation: number;
  internal: boolean;
  touchSupport: string;
}

declare global {
  interface Window {
    electronAPI: {
      getServerIp: () => Promise<string>;
      connectTraccar: () => Promise<{ success: boolean; port: number | undefined }>;
      getLocalVideoUrl: (path: string) => Promise<string>;
      onDownloadProgress: (callback: (progress: DownloadProgress) => void) => void;
      onLocationUpdate: (callback: (location: any) => void) => void;
      getDownloadsPath: (fileName: string) => Promise<string>;
      downloadFile: (campaignId: string, url: string, mediaType: string) => Promise<{ success: boolean; path?: string; error?: string }>;
      getCampaigns: () => Promise<any>;
      updateCampaign: (campaignId: number, downloadPath: string) => Promise<any>;
      closeWindow: () => void;
      minimizeWindow: () => void;
      checkFileExists: (filePath: string) => Promise<boolean>;
      createExternalWindow: () => Promise<boolean>;
      closeExternalWindow: () => Promise<boolean>;
      getWindowType: () => Promise<string>;
      accessFile: (path: string) => Promise<void>;
      syncVideoAction: (action: any) => void;
      onSyncUpdate: (callback: (update: any) => void) => void;
      getDisplays: () => Promise<Display[]>;
      getScreenThumbnail: (sourceId: string) => Promise<string>;
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  private electron: any;
  private windowType: string | null = null;

  constructor(private loggingService: LoggingService) {
    if (this.isElectron()) {
      this.electron = (window as any).electronAPI;
      // Get window type on initialization
      this.electron.getWindowType().then((type: string) => {
        this.windowType = type;
      });
    }
  }

  isElectron(): boolean {
    return !!(window && (window as any).electronAPI);
  }

  getServerIp(): Promise<string> {
    if (this.isElectron()) {
      return this.electron.getServerIp();
    }
    return Promise.reject('Not running in Electron');
  }

  async connectTraccar(): Promise<{ success: boolean, port: number | undefined, error?: string }> {
    if (this.isElectron()) {
      try {
        // Use cached window type if available
        const windowType = this.windowType || await this.electron.getWindowType();
        
        if (windowType === 'external') {
          return { success: true, port: undefined };
        }

        const result = await this.electron.connectTraccar();
        return result;
      } catch (error: any) {
        return { success: false, error: error.message, port: undefined };
      }
    }
    return Promise.reject({ success: false, error: 'Not running in Electron' });
  }

  disconnectTraccar(): Promise<{ success: boolean, error?: string }> {
    return Promise.reject('Not running in Electron');
  }

  onDownloadProgress(): Observable<DownloadProgress> {
    if (this.isElectron()) {
      return new Observable(observer => {
        const cleanup = this.electron.onDownloadProgress((progress: { id: string, progress: number }) => {
          observer.next(progress);
        });
        return cleanup;
      });
    }
    return new Observable(observer => {
      observer.error('Not running in Electron');
    });
  }

  onLocationUpdate(): Observable<string> {
    if (this.isElectron()) {
      
      return new Observable(observer => {
        const cleanup = this.electron.onLocationUpdate((update: string) => {

          observer.next(update);
        });
        return cleanup;
      });
    }
    
    return new Observable(observer => {
      observer.error('Not running in Electron');
    });
  }

  async getLocalVideoUrl(path: string): Promise<string> {
    if (!this.isElectron()) {
      return Promise.reject('Not running in Electron');
    }

    try {
      const exists = await this.fileExists(path);
      if (!exists) {
        throw new Error(`File does not exist at path: ${path}`);
      }

      return this.electron.getLocalVideoUrl(path);
    } catch (error) {
      this.loggingService.log(
        'electron.service.ts : getLocalVideoUrl',
        'Error getting local URL:',
        error
      );
      throw error;
    }
  }

  // Add these two methods
  getDownloadsPath(fileName: string): Promise<string> {
    if (this.isElectron()) {
      return this.electron.getDownloadsPath(fileName);
    }
    return Promise.reject('Not running in Electron');
  }

  // Add the following method
  downloadFile(campaignId: string, url: string, mediaType: string): Promise<{ success: boolean; path?: string; error?: string }> {
    if (this.isElectron()) {
      return this.electron.downloadFile(campaignId, url, mediaType);
    }
    return Promise.reject({ success: false, error: 'Not running in Electron' });
  }
  getCampaigns(): Promise<any> {
    if (this.isElectron()) {
      return this.electron.getCampaigns();
    }
    return Promise.reject('Not running in Electron');
  }
  updateCampaign(campaignId: number, downloadPath: string): Promise<any> {
    if (this.isElectron()) {
      return this.electron.updateCampaign(campaignId, downloadPath);
    }
    return Promise.reject('Not running in Electron');
  }

  async closeWindow(): Promise<void> {
    if (this.isElectron()) {
      // First close external window
      await this.closeExternalWindow();
      // Then close main window
      this.electron.closeWindow();
    }
  }

  minimizeWindow(): void {
    if (this.isElectron()) {
      this.electron.minimizeWindow();
    }
  }

  // Add to the existing methods
  checkFileExists(filePath: string): Promise<boolean> {
    if (this.isElectron()) {
      return this.electron.checkFileExists(filePath)
        .then((exists: boolean) => {
          return exists;
        })
        .catch((error: any) => {
          return false;
        });
    }
    return Promise.reject('Not running in Electron');
  }

  createExternalWindow(displayConfig?: any): Promise<boolean> {
    if (this.isElectron()) {
      return this.electron.createExternalWindow(displayConfig)
        .then((result: boolean) => {
          return result;
        })
        .catch((error: any) => {
          return false;
        });
    }
    return Promise.reject('Not running in Electron');
  }

  async closeExternalWindow(): Promise<boolean> {
    if (this.isElectron()) {
      return this.electron.closeExternalWindow()
        .catch((error: any) => {
          this.loggingService.log(
            'electron.service.ts : closeExternalWindow',
            'Error closing external window:',
            error
          );
          return false;
        });
    }
    return Promise.resolve(false);
  }

  async getWindowType(): Promise<string> {
    if (this.isElectron()) {
      try {
        // Use cached window type if available
        if (this.windowType) {
          return this.windowType;
        }
        
        // Otherwise get it from electron
        const type = await this.electron.getWindowType();
        this.windowType = type;
        return type;
      } catch (error) {
        return 'unknown';
      }
    }
    return 'browser';
  }

  private async fileExists(path: string): Promise<boolean> {
    if (!this.isElectron()) {
      return false;
    }
    
    try {
      await this.electron.accessFile(path);
      return true;
    } catch {
      return false;
    }
  }

  syncVideoAction(action: any): void {
    if (this.isElectron()) {
      this.electron.syncVideoAction(action);
    }
  }

  async getFilePath(fileName: string): Promise<string> {
    return this.electron.invoke('get-file-path', fileName);
  }

  getDisplays(): Promise<Display[]> {
    if (this.isElectron()) {
      return this.electron.getDisplays();
    }
    return Promise.reject('Not running in Electron');
  }

  getScreenThumbnail(sourceId: string): Promise<string> {
    if (this.isElectron()) {
      return this.electron.getScreenThumbnail(sourceId);
    }
    return Promise.reject('Not running in Electron');
  }
}
