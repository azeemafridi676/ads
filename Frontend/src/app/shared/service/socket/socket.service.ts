import { Injectable } from "@angular/core";
import { io, Socket } from "socket.io-client";
import { AuthService } from "../Auth/Auth.service";
import { environment } from "src/environments/environment";
import { BehaviorSubject, Observable } from "rxjs";
import { ToastrService } from "ngx-toastr";
import { ChatService } from "../chat/chat.service";
import { LoggingService } from "../logging.service";
import { NotificationService } from "../notification/notification.service";

interface ChatMessage {
  _id: string;
  message: string;
  createdAt: Date;
  isAdmin: boolean;
  sender: string;
  status: "sent" | "delivered" | "read";
  threadId: string;
}

@Injectable({
  providedIn: "root",
})
export class SocketService {
  private socket!: Socket;
  private subscriptionEvents = new BehaviorSubject<any>(null);
  private connectionStatus = new BehaviorSubject<boolean>(false);

  // Chat related subjects
  private newMessages = new BehaviorSubject<ChatMessage | null>(null);
  private userStatusUpdates = new BehaviorSubject<any>(null);
  private threadStatusUpdates = new BehaviorSubject<any>(null);
  private unreadCount = new BehaviorSubject<number>(0);
  private chatService?: ChatService;
  private notifications = new BehaviorSubject<any[]>([]);
  private readonly SOURCE = "socket.service.ts";
  private messageStatusUpdates = new BehaviorSubject<any>(null);
  private playedLocationsUpdates = new BehaviorSubject<any>(null);
  private playedLocationsUpdatesAdmin = new BehaviorSubject<any>(null);
  private campaignCycleUpdates = new BehaviorSubject<any>(null);
  private campaignCycleUpdatesAdmin = new BehaviorSubject<any>(null);
  private adminStatusUpdates = new BehaviorSubject<any>(null);
  private newMessagesForAdmin = new BehaviorSubject<any>(null);

  setChatService(service: ChatService) {
    this.chatService = service;
  }

  constructor(
    private authService: AuthService,
    private loggingService: LoggingService,
    private notificationService: NotificationService
  ) {
    this.authService.getAuthenticated().subscribe((isAuthenticated) => {
      if (isAuthenticated) {
        // check if the socket is already connected
        if (!this.socket) {
          this.connect();
        } else {
          this.loggingService.log(this.SOURCE, `Socket is already connected`);
        }
      } else {
        this.disconnect();
      }
    });
  }
  getSocket() {
    return this.socket;
  }
  private connect(): void {
    const token = this.authService.getAccessToken();
    if (!token) return;

    this.socket = io(environment.BACKEND_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Add these event listeners
    this.socket.on("connect", () => {
      this.connectionStatus.next(true);
    });

    this.socket.on("disconnect", () => {
      this.connectionStatus.next(false);
    });

    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    // Keep existing listeners
    this.socket.on("new_message_recieved_from_admin", (message: any) => {
      this.newMessages.next(message);
    });
    this.socket.on("new_message_recieved_from_user", (message: any) => {
      this.newMessagesForAdmin.next(message.message);
    });

    // Add logging for message status updates
    this.socket.on('message_status_update', (update: any) => {
      this.messageStatusUpdates.next(update);
    });

    this.socket.on("admin_status_changed", (data: any) => {
      this.loggingService.log(this.SOURCE, `admin_status_changed received from socket: ${JSON.stringify(data, null, 2)}`);
      this.adminStatusUpdates.next(data);
    });

    this.socket.on("subscription_event", (data: any) => {
      this.loggingService.log(this.SOURCE, `subscription_event received from socket: ${JSON.stringify(data, null, 2)}`);
      this.subscriptionEvents.next(data);
    });
    this.socket.on("user_status_changed", (data: any) => {
      this.userStatusUpdates.next(data);
    });
    this.socket.on("thread_status_update", (data: any) => {
      this.threadStatusUpdates.next(data);
    });

    this.socket.on("notification", (notification: any) => {
      const currentNotifications = this.notifications.value;
      this.loggingService.log(this.SOURCE, `Received notification: ${JSON.stringify(notification, null, 2)}`);
      this.notifications.next([notification, ...currentNotifications]);
      this.unreadCount.next(this.unreadCount.value + 1);
      // Refresh notifications in the NotificationService to sync the state
      this.notificationService.refreshNotifications();
    });

    this.socket.on('played_locations_updated', (data: any) => {
      if (!data.campaignId || !data.playedLocations) {
          this.loggingService.log(this.SOURCE, `❌ Invalid data received in played_locations_updated`);
          return;
      }
      
      this.playedLocationsUpdates.next(data);
      this.campaignCycleUpdates.next(data);
    });

    this.socket.on('played_locations_updated_admin', (data: any) => {
      this.playedLocationsUpdatesAdmin.next(data);
      this.campaignCycleUpdatesAdmin.next(data);
    });
  }

  getNewMessages(): Observable<ChatMessage | null> {
    return this.newMessages.asObservable();
  }
  getuserStatusUpdates(): Observable<any> {
    return this.userStatusUpdates.asObservable();
  }

  getAdminStatusUpdates(): Observable<any> {
    return this.adminStatusUpdates.asObservable();
  }
  getNewMessagesForAdmin(): Observable<any> {
    return this.newMessagesForAdmin.asObservable();
  }

  getThreadStatusUpdates(): Observable<any> {
    return this.threadStatusUpdates.asObservable();
  }
  getConnectionStatus(): Observable<boolean> {
    return this.connectionStatus.asObservable();
  }
  getSubscriptionEvents(): Observable<any> {
    return this.subscriptionEvents.asObservable();
  }
  public connectToThread(threadId: string): void {
    this.socket.on(threadId, (data: any) => {
      if (data.message) {
        this.newMessages.next(data.message);
        if (data.message.isAdmin) {
          this.unreadCount.next(this.unreadCount.value + 1);
        }
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      // Ensure we're cleaning up all listeners before disconnecting
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null as any;  // Clear the socket instance
      this.connectionStatus.next(false);
      
      // Reset all subjects
      this.newMessages.next(null);
      this.userStatusUpdates.next(null);
      this.threadStatusUpdates.next(null);
      this.subscriptionEvents.next(null);
      this.messageStatusUpdates.next(null);
      this.playedLocationsUpdates.next(null);
      this.playedLocationsUpdatesAdmin.next(null);
      this.notifications.next([]);
      this.unreadCount.next(0);
    } else {
      this.loggingService.log(this.SOURCE, "Socket instance not found during disconnect");
    }
  }

  reconnect(): void {
    try {
      // If socket exists, first properly disconnect
      if (this.socket) {
        this.disconnect();
      }

      // Create new connection
      this.connect();
      
    } catch (error) {
      this.loggingService.log(this.SOURCE, "Error in reconnect function", error);
      this.connectionStatus.next(false);
    }
  }

  getNotifications(): Observable<any[]> {
    return this.notifications.asObservable();
  }

  getUnreadCount(): Observable<number> {
    return this.unreadCount.asObservable();
  }

  markNotificationsAsRead(notificationIds: string[]) {
    this.socket.emit("mark_notifications_read", notificationIds);
    const currentNotifications = this.notifications.value.map(
      (notification) => {
        if (notificationIds.includes(notification._id)) {
          return { ...notification, read: true };
        }
        return notification;
      }
    );
    this.notifications.next(currentNotifications);
    this.updateUnreadCount();
  }

  private updateUnreadCount() {
    const unreadCount = this.notifications.value.filter((n) => !n.read).length;
    this.unreadCount.next(unreadCount);
  }

  // Add this method to subscribe to message status updates
  getMessageStatusUpdates(): Observable<any> {
    return this.messageStatusUpdates.asObservable();
  }

  getPlayedLocationsUpdates(): Observable<any> {
    return this.playedLocationsUpdates.asObservable();
  }
  getPlayedLocationsUpdatesAdmin(): Observable<any> {
    return this.playedLocationsUpdatesAdmin.asObservable();
  }

  getCampaignCycleUpdates(): Observable<any> {
    return this.campaignCycleUpdates.asObservable();
  }

  getCampaignCycleUpdatesAdmin(): Observable<any> {
    return this.campaignCycleUpdatesAdmin.asObservable();
  }
}
