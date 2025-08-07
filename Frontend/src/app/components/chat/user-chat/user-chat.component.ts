import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewChecked } from '@angular/core';
import { ChatService } from 'src/app/shared/service/chat/chat.service';
import { AuthService } from 'src/app/shared/service/Auth/Auth.service';
import { SocketService } from 'src/app/shared/service/socket/socket.service';
import { Subscription } from 'rxjs';
import { NavService } from 'src/app/shared/service/navbar/nav.service';
import { LoggingService } from 'src/app/shared/service/logging.service';
import { take } from 'rxjs/operators';

interface ChatMessage {
  _id: string;
  message: string;
  createdAt: Date;
  isAdmin: boolean;
  sender: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  attachments?: Array<{ url: string; name: string; type: string }>;
}

interface ChatResponse {
  status: number;
  message: string;
  data: ChatMessage;
}

@Component({
  selector: 'app-user-chat',
  templateUrl: './user-chat.component.html',
  styleUrls: ['./user-chat.component.scss']
})
export class UserChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  loading: boolean = false;
  messages: ChatMessage[] = [];
  newMessage: string = '';
  isTyping: boolean = false;
  userDetail: any;
  isAdminOnline: boolean = false;
  private subscriptions: Subscription[] = [];
  private readonly SOURCE = 'user-chat.component.ts';
  private shouldScroll: boolean = false; // Flag to trigger scroll after view update
  private connectionStatus: boolean = false;
  private reconnectionAttempts = 0;
  private readonly MAX_RECONNECTION_ATTEMPTS = 3;
  private lastReconnectTime: number = 0;
  private readonly RECONNECT_COOLDOWN = 5000; // 5 seconds cooldown
  readonly MAX_MESSAGE_LENGTH = 500;
  readonly MAX_TEXTAREA_HEIGHT = 150; // Maximum height in pixels

  constructor(
    private chatService: ChatService,
    private socketService: SocketService,
    private authService: AuthService,
    private navService: NavService,
    private loggingService: LoggingService
  ) {
    // Remove constructor subscription to avoid duplicate subscriptions
  }

  ngOnInit() {
    this.subscriptions.push(
      this.authService.getAuthenticated().subscribe(isAuthenticated => {
        if (!isAuthenticated) {
          this.reconnectionAttempts = 0;
          this.lastReconnectTime = 0;
        }
      }),
      
      this.socketService.getConnectionStatus().subscribe(isConnected => {
        const currentToken = this.authService.getAccessToken();
        const isAuthenticated = !!currentToken;
        this.connectionStatus = isConnected;
        
        if (isConnected && isAuthenticated) {
          this.reconnectionAttempts = 0;
          this.lastReconnectTime = 0;
          this.initializeChat();
          this.initializeSocketListeners();
        } else if (!isConnected && isAuthenticated) {
          const now = Date.now();
          const timeSinceLastReconnect = now - this.lastReconnectTime;
          
          if (timeSinceLastReconnect < this.RECONNECT_COOLDOWN) {
            return;
          }

          this.reconnectionAttempts++;
          this.lastReconnectTime = now;
          
          if (this.reconnectionAttempts <= this.MAX_RECONNECTION_ATTEMPTS) {
            this.socketService.reconnect();
          }
        }
      })
    );
    
    this.navService.setTitle('Live Support');
    this.navService.setSubtitle('24/7 Customer Assistance');
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false; // Reset flag after scrolling
    }
  }

  private initializeSocketListeners() {
    this.subscriptions.push(
      this.socketService.getNewMessages().subscribe(message => {
        if (message) {
          this.messages = [...this.messages, message];
          this.shouldScroll = true;
          this.chatService.markMessagesAsRead(message.threadId).subscribe();
        }
      }),
      this.socketService.getMessageStatusUpdates().subscribe(update => {
        if (update) {
          this.messages = this.messages.map(msg => {
            if (msg.status !== 'read') {
              return { ...msg, status: 'read' };
            }
            return msg;
          });
          this.shouldScroll = true;
        }
      }),
      this.socketService.getAdminStatusUpdates().subscribe(update => {
        if (update) {
          this.isAdminOnline = update.status === 'online';
        }
      })
    );
  }

  private initializeChat() {
    this.loading = true;
    const currentToken = this.authService.getAccessToken();

    this.authService.getUserDetails()
      .pipe(take(1))
      .subscribe({
        next: (user) => {
          if (!user) {
            return;
          }
          this.userDetail = user;
          // Check admin status first
          this.authService.checkAdminStatus().subscribe({
            next: (isAdminOnline) => {
              this.isAdminOnline = isAdminOnline;
              this.loadMessages();
            },
            error: (error) => {
              this.loading = false;
              this.loggingService.log(this.SOURCE, 'Error checking admin status', error);
            }
          });
        },
        error: (error) => {
          this.loading = false;
        }
      });
  }

  private loadMessages() {
    this.loading = true;
    this.chatService.getThreadMessages().subscribe({
      next: (response: any) => {
        if (response && response.data) {
          this.messages = response.data;
        }
        this.shouldScroll = true;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
      }
    });
  }

  onMessageInput(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    
    // Handle character limit
    if (textarea.value.length > this.MAX_MESSAGE_LENGTH) {
      textarea.value = textarea.value.substring(0, this.MAX_MESSAGE_LENGTH);
      this.newMessage = textarea.value;
    }

    // Auto-resize logic
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, this.MAX_TEXTAREA_HEIGHT);
    textarea.style.height = `${newHeight}px`;
    
    // Add/remove scrolling if needed
    textarea.style.overflowY = textarea.scrollHeight > this.MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden';
  }

  async sendMessage() {
    if (!this.newMessage.trim() || this.newMessage.length > this.MAX_MESSAGE_LENGTH) return;
    const messageText = this.newMessage.trim();
    this.newMessage = '';

    const tempMessage: ChatMessage = {
      _id: 'temp_' + new Date().getTime(),
      message: messageText,
      createdAt: new Date(),
      isAdmin: false,
      sender: this.userDetail._id,
      status: 'sent'
    };

    this.messages = [...this.messages, tempMessage];
    this.shouldScroll = true; // Trigger scroll after view updates

    try {
      const result = await this.chatService.sendMessage(messageText).toPromise();
      const response = result as unknown as ChatResponse;
      if (response?.data) {
        // Update the message status while preserving 'read' status if it exists
        this.messages = this.messages.map(msg => {
          if (msg._id === tempMessage._id) {
            const currentStatus = msg.status === 'read' ? 'read' : 'delivered';
            return { ...response.data, status: currentStatus };
          }
          return msg;
        });
        this.shouldScroll = true;
      }
    } catch (error) {
      this.messages = this.messages.map(msg =>
        msg._id === tempMessage._id ? { ...msg, status: 'failed' } : msg
      );
      this.newMessage = messageText;
      this.shouldScroll = true;
    }
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    if (this.messageContainer) {
      const element = this.messageContainer.nativeElement;
      element.scrollTo({
        top: element.scrollHeight,
        behavior: 'smooth'
      });
    }
  }

  formatTimestamp(timestamp: Date): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.chatService.clearChat();
  }
}