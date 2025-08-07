import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { AuthService } from '../Auth/Auth.service';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { LoggingService } from '../logging.service';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket!: Socket;
  private connectionStatus = new BehaviorSubject<boolean>(false);
  private newCampaigns = new Subject<any>();
  private testEventSubject = new BehaviorSubject<any>(null);
  private campaignCache = new Set<string>();
  
  constructor(
    private authService: AuthService,
    private loggingService: LoggingService
  ) {
    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.connect();
      } else {
        this.disconnect();
      }
    });
  }

  private connect(): void {
    const token = this.authService.getAccessToken();
    if (!token) {
      this.loggingService.log('error', 'Socket connection failed: No auth token available');
      return;
    }

    this.loggingService.log('info', `Attempting socket connection to ${environment.BACKEND_URL} as driver`);

    this.socket = io(environment.BACKEND_URL, {
      auth: { token, role: 'driver' },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
      withCredentials: true,
      forceNew: true,
      timeout: 10000
    });

    // Log socket configuration

    // Add connection error handler before setting up other listeners
    this.socket.on('error', (error: any) => {
      this.loggingService.log('error', 'Socket general error:', error);
    });

    this.socket.on('connect_error', (error) => {
      this.loggingService.log('error', 'Socket connection error details:', {
        message: error.message,
        context: {
          url: environment.BACKEND_URL,
          transport: this.socket.io.engine?.transport?.name,
          role: 'driver'
        }
      });
    });

    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    // Connection events
    this.socket.on('connect', () => {
      this.connectionStatus.next(true);
    });

    // Add test event listener
    this.socket.on('testing the socket', (data: any) => {
      this.testEventSubject.next(data);
    });

    this.socket.on('connect_error', (error) => {
      this.loggingService.log('error', `Socket connection error: ${error.message}`);
      this.connectionStatus.next(false);
    });

    this.socket.on('disconnect', (reason) => {
      this.loggingService.log('info', `Socket disconnected. Reason: ${reason}`);
      this.connectionStatus.next(false);
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      this.loggingService.log('info', `Socket reconnection attempt ${attemptNumber}`);
    });

    // Campaign events
    this.socket.on('campaign_created', (data: any) => {
      this.loggingService.log('info', 'Received campaign_created event:', {
        type: data.type,
        campaignId: data.campaign?._id,
        campaignName: data.campaign?.campaignName
      });
      this.newCampaigns.next(data.campaign);
    });
  }

  getSocket() {
    return this.socket;
  }

  getNewCampaigns(): Observable<any> {
    return this.newCampaigns.asObservable();
  }

  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus.asObservable();
  }

  getTestEvents(): Observable<any> {
    return this.testEventSubject.asObservable();
  }

  disconnect(): void {
    if (this.socket) {
      this.loggingService.log('info', 'Disconnecting socket');
      this.campaignCache.clear();
      this.socket.disconnect();
    }
  }

  reconnect(): void {
    if (this.socket) {
      this.loggingService.log('info', 'Attempting socket reconnection');
      this.socket.connect();
    }
  }

  // Add method to check current connection state
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}