import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from "@angular/core";
import { ChatService } from "src/app/shared/service/chat/chat.service";
import { SocketService } from "src/app/shared/service/socket/socket.service";
import { Subscription } from "rxjs";
import {
  throttleTime,
  debounceTime,
  distinctUntilChanged,
} from "rxjs/operators";
import { Subject } from "rxjs";
import { NavService } from "src/app/shared/service/navbar/nav.service";
import { LoggingService } from "src/app/shared/service/logging.service";
import { ActivatedRoute } from "@angular/router";

interface ChatThread {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  lastMessage?: string;
  unreadCount: number;
  status: "active" | "resolved" | "closed" | "pending";
  lastActivity: Date;
  category: string;
}

interface ChatMessage {
  _id: string;
  message: string;
  createdAt: Date;
  isAdmin: boolean;
  sender: string;
  status: "sent" | "delivered" | "read" | "failed";
  threadId: string;
}

interface ChatResponse {
  status: number;
  message: string;
  data: ChatMessage;
}

@Component({
  selector: "app-admin-chat",
  templateUrl: "./admin-chat.component.html",
  styleUrls: ["./admin-chat.component.scss"],
})
export class AdminChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild("messageContainer") private messageContainer!: ElementRef;
  @ViewChild("messageInput") private messageInput!: ElementRef;

  threads: any[] = [];
  selectedThread: any | null = null;
  messages: any[] = [];
  newMessage: string = "";
  loading = false;
  page = 1;
  limit = 10;
  hasMore = true;
  searchTerm = "";
  private subscriptions: Subscription[] = [];
  private readonly THREAD_LOAD_DELAY = 300; // 300ms
  private threadLoadSubject = new Subject<{
    page: number;
    loadMore: boolean;
  }>();
  private readonly SOURCE = "admin-chat.component.ts";
  private shouldScroll: boolean = false;
  private searchDebounce = new Subject<string>();
  private pendingThreadFetches = new Set<string>(); // Add this line to track pending thread fetches
  readonly MAX_MESSAGE_LENGTH = 500;
  readonly MAX_TEXTAREA_HEIGHT = 150; // Maximum height in pixels

  constructor(
    private chatService: ChatService,
    private socketService: SocketService,
    private navService: NavService,
    private loggingService: LoggingService,
    private route: ActivatedRoute
  ) {
    // Setup search debounce
    this.searchDebounce
      .pipe(debounceTime(300))
      .subscribe((term) => {
        this.handleSearch(term);
      });

    this.threadLoadSubject
      .pipe(debounceTime(this.THREAD_LOAD_DELAY), distinctUntilChanged())
      .subscribe(({ page, loadMore }) => {
        this.loading = true;
        this.chatService
          .getAdminThreads(page, this.limit, this.searchTerm)
          .subscribe({
            next: (response: any) => {
              const newThreads = response.data;
              this.threads = loadMore
                ? [...this.threads, ...newThreads]
                : newThreads;
              this.hasMore = newThreads.length === this.limit;
              this.loading = false;
            },
            error: (error) => {
              this.loggingService.log(
                this.SOURCE,
                `Error loading threads: ${JSON.stringify(error, null, 2)}`
              );
              this.loading = false;
            },
          });
      });
  }

  ngOnInit() {
    this.socketService.getConnectionStatus().subscribe(isConnected => {
      if (isConnected) {
        this.loggingService.log(this.SOURCE, `Socket is connected`);
        this.initializeSocketListeners();
        // First load threads, then handle URL params
        this.loadThreads();
        // Handle threadId from query params
        this.route.queryParams.subscribe((params) => {
          const threadId = params["threadId"];
          if (threadId) {
            // Find thread in loaded threads or load it specifically
            this.chatService.getThreadById(threadId).subscribe({
              next: (response: any) => {
                if (response?.data) {
                  const thread = response.data;
                  this.loggingService.log(this.SOURCE, "reloaded due to there is a thread id param in the url")
                  this.reloadThread(thread);
                }
              },
              error: (error: Error) => {},
            });
          }
        });
      } else {
        this.loggingService.log(this.SOURCE, `Socket is not connected`);
        // connect to socket
        this.socketService.reconnect();
      }
    });

    this.navService.setTitle("Admin Chat");
    this.navService.setSubtitle("24/7 Customer Assistance");
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private isDuplicateMessage(message: any): boolean {
    return this.messages.some(existingMessage => 
      existingMessage.threadId === message.threadId &&
      existingMessage.message === message.message &&
      new Date(existingMessage.createdAt).getTime() === new Date(message.createdAt).getTime()
    );
  }

  private initializeSocketListeners() {
    this.subscriptions.push(
      this.socketService.getNewMessagesForAdmin().subscribe((message) => {
        if (message) {       
          this.loggingService.log(this.SOURCE, `New message received from socket: ${JSON.stringify(message, null, 2)}`);
          
          // Check if message already exists
          if (this.isDuplicateMessage(message)) {
            this.loggingService.log(this.SOURCE, `Duplicate message detected, skipping: ${message.message}`);
            return;
          }

          if (this.selectedThread?._id === message.threadId) {
            this.messages = [...this.messages, message];
            this.shouldScroll = true;
            
            // Immediately mark as read if it's the current thread
            if (!message.isAdmin) {
              this.loggingService.log(this.SOURCE, "from admin side the message is marking as read ....")
              this.chatService.markMessagesAsRead(message.threadId).subscribe({
                next: () => {
                  this.loggingService.log(this.SOURCE, `message is marked as read by admin because the admin got a new message`);
                },
                error: (error) => {
                  this.loggingService.log(this.SOURCE, `Error marking message as read: ${error}`);
                }
              });
            }
          }

          // Update thread's last message and sort
          this.updateThreadLastMessage(message);
          this.sortThreads();
        }
      }),
      this.socketService.getThreadStatusUpdates().subscribe((update) => {
        if (update && update.threadId === this.selectedThread?._id) {
          this.loggingService.log(this.SOURCE, "reloaded due to received thread status update")
          this.reloadThread(this.selectedThread);
        }
      }),
      this.socketService.getuserStatusUpdates().subscribe((status) => {
        if (status && status.userId) {
          // Update userStatus for all threads with matching userId
          this.threads = this.threads.map(thread => {
            if (thread.userId._id === status.userId) {
              return { ...thread, userStatus: status.status };
            }
            return thread;
          });
          
          // Update selected thread if it matches
          if (this.selectedThread?.userId._id === status.userId) {
            this.selectedThread = { ...this.selectedThread, userStatus: status.status };
          }
          
          this.loggingService.log(this.SOURCE, `Updated user status for user ${status.userId} to ${status.status}`);
        }
      }),
      this.socketService.getMessageStatusUpdates().subscribe((update) => {
        if (update) {
          this.loggingService.log(this.SOURCE, `Message status update is received from user to admin: because the message status update is received ${JSON.stringify(update)}`)
            if (update && update.threadId === this.selectedThread?._id) {
              this.messages = this.messages.map((msg) => {
                if (msg.threadId === update.threadId && msg.status !== "read") {
                  return { ...msg, status: update.status };
                }
                return msg;
            });
          }
        }
      })
    );
  }

  // Handle search input
  onSearchInput(term: string) {
    this.searchDebounce.next(term);
  }

  // Handle search with debounce
  private handleSearch(term: string) {
    this.searchTerm = term;
    this.page = 1; // Reset page when searching
    this.hasMore = true; // Reset hasMore flag
    this.loadThreads(false); // Load first page of search results
  }

  // Load threads with better control
  loadThreads(loadMore = false) {
    if (loadMore) {
      this.page++;
    }
    
    this.loading = true;
    this.threadLoadSubject.next({ page: this.page, loadMore });
  }

  reloadThread(thread: any) {
    if (!thread || !thread._id) return;
    this.selectedThread = thread;
    
    // Reset unread count when a thread is selected
    thread.unreadCount = 0;
    
    this.chatService.setActiveThread(thread);
    this.loadMessages(thread._id);
    this.shouldScroll = true;

    // Focus on message input after thread selection
    setTimeout(() => {
      this.messageInput?.nativeElement?.focus();
    }, 100);
  }
  private loadMessages(threadId: string) {
    if (!threadId) {
      return;
    }
    this.loading = true;
    this.chatService
      .getThreadMessagesAdmin(threadId, this.page, this.limit)
      .subscribe({
        next: (messages: any) => {
          this.messages = messages.data;
          
          // Reset the unread count in the currently selected thread
          if (this.selectedThread) {
            const threadIndex = this.threads.findIndex(t => t._id === threadId);
            if (threadIndex !== -1) {
              this.threads[threadIndex].unreadCount = 0;
              // Create new array reference to trigger change detection
              this.threads = [...this.threads];
            }
          }
          
          this.loadThreads();
          this.shouldScroll = true;

          // Mark messages as read and emit socket event
          this.chatService.markMessagesAsRead(threadId).subscribe({
            next: () => {
              this.loggingService.log(this.SOURCE, "from admin side the message is marked as read because messages are loaded")
              this.loading = false;
              // Ensure we scroll after marking messages as read
              this.shouldScroll = true;
            },
            error: (error) => {
              this.loading = false;
            },
          });
        },
        error: (error: any) => {
          this.loading = false;
        },
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
    if (!this.newMessage.trim() || !this.selectedThread || this.loading || this.newMessage.length > this.MAX_MESSAGE_LENGTH) return;
    const messageText = this.newMessage.trim();
    this.newMessage = "";

    // Create temporary message with single tick
    const tempMessage: ChatMessage = {
      _id: "temp_" + new Date().getTime(),
      message: messageText,
      createdAt: new Date(),
      isAdmin: true,
      sender: "admin",
      status: "sent", // Single tick
      threadId: this.selectedThread._id,
    };

    // Immediately append to UI
    this.messages = [...this.messages, tempMessage];
    this.shouldScroll = true;

    try {
      // Send to backend and cast response
      const result = await this.chatService
        .sendAdminMessage(this.selectedThread._id, messageText)
        .toPromise();
      const response = result as unknown as ChatResponse;

        // Update the temporary message with saved message (double tick)
      if (response?.data) {
          this.messages = this.messages.map((msg) =>
            msg._id === tempMessage._id
              ? { ...response.data, status: "delivered" }
              : msg
          );
      }
    } catch (error) {
        this.loggingService.log(this.SOURCE, `Error sending message: ${error}`);
      // Mark message as failed
      this.messages = this.messages.map((msg) =>
        msg._id === tempMessage._id ? { ...msg, status: "failed" } : msg
      );
      this.newMessage = messageText; // Restore message text on error
    }
  }
  private updateThreadLastMessage(message: any) {
    try {
      let updatedThread = this.threads.find((t) => t._id === message.threadId);
      
      if (updatedThread) {      
        // Update the existing thread object with new message info
        updatedThread.lastActivity = new Date(message.createdAt);
        
        // Don't increment unread count if this is the selected thread
        if (this.selectedThread && this.selectedThread._id === message.threadId) {
          // For the selected thread, don't show unread count
          updatedThread.unreadCount = 0;
        } else {
          // For other threads, update the unread count as normal
          updatedThread.unreadCount = message.unreadCount || 0;
        }
        updatedThread.lastMessage = {
          threadId: message.threadId,
          sender: message.sender,
          isAdmin: message.isAdmin,
          message: message.message,
          unreadCount: updatedThread.unreadCount,
          attachments: message.attachments || [],
          status: message.status,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt
        };
      } else if (message.threadId && !this.pendingThreadFetches.has(message.threadId)) {
        // Add threadId to pending fetches to prevent duplicate fetches
        this.pendingThreadFetches.add(message.threadId);
        
        // If the thread doesn't exist in our threads array, fetch it from the server
        this.chatService.getThreadById(message.threadId).subscribe({
          next: (response: any) => {
            if (response?.data) {
              // Check if thread already exists (in case another fetch completed first)
              const existingThread = this.threads.find(t => t._id === message.threadId);
              if (!existingThread) {
                // Add new thread to the beginning of the threads array
                const newThread = response.data;
                
                // Set last message
                newThread.lastMessage = {
                  threadId: message.threadId,
                  sender: message.sender,
                  isAdmin: message.isAdmin,
                  message: message.message,
                  unreadCount: message.unreadCount || 1,
                  attachments: message.attachments || [],
                  status: message.status,
                  createdAt: message.createdAt,
                  updatedAt: message.updatedAt
                };
                // Add the new thread to the threads array
                this.threads = [newThread, ...this.threads];
              }
            }
            // Remove from pending fetches regardless of success
            this.pendingThreadFetches.delete(message.threadId);
          },
          error: (error) => {
            this.loggingService.log(this.SOURCE, `Error fetching thread by ID: ${error}`);
            // Remove from pending fetches on error
            this.pendingThreadFetches.delete(message.threadId);
          }
        });
      }
      
      // Create new array reference to trigger change detection
      this.threads = [...this.threads];
      this.sortThreads();
    } catch (error) {
      this.loggingService.log(this.SOURCE, `Error updating thread last message: ${error}`);
    }
  }
  private sortThreads() {
    this.threads.sort(
      (a, b) =>
        new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );
  }
  private scrollToBottom(): void {
    if (this.messageContainer) {
      const element = this.messageContainer.nativeElement;
      element.scrollTo({
        top: element.scrollHeight,
        behavior: "smooth",
      });
    }
  }
  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.chatService.clearChat();
    this.threadLoadSubject.complete();
    this.searchDebounce.complete();
    // Null out to free memory
    this.threadLoadSubject = null as any;
    this.searchDebounce = null as any;
  }
  goBack() {
    this.selectedThread = null;
  }
  onKeyPress(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
  formatTimestamp(timestamp: Date): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
}
