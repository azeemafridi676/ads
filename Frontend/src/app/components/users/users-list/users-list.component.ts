import { Component, OnInit, HostListener, ElementRef, ViewChildren, QueryList, OnDestroy } from '@angular/core';
import { UserService, User, PaginatedResponse } from 'src/app/shared/service/user/user.service';
import { ToastrService } from 'ngx-toastr';
import { NavService } from 'src/app/shared/service/navbar/nav.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ChatService } from 'src/app/shared/service/chat/chat.service';
import { LoggingService } from 'src/app/shared/service/logging.service';
import { SubscriptionsService } from 'src/app/shared/service/subscriptions/subscriptions.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SocketService } from 'src/app/shared/service/socket/socket.service';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent implements OnInit, OnDestroy {
  @ViewChildren('actionDropdown') actionDropdowns!: QueryList<ElementRef>;
  
  // Gift Subscription Modal
  showGiftSubscriptionModal = false;
  selectedSubscription: any = null;
  subscriptions: any[] = [];
  loadingSubscriptions = false;
  
  users: User[] = [];
  loading = false;
  error: string | null = null;
  searchTerm: string = '';
  activeDropdown: string | null = null;
  private searchSubject = new Subject<string>();
  
  // Expanded state tracking
  expandedState: { [key: string]: Set<string> } = {};
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 10;
  protected readonly Math = Math;

  private readonly SOURCE = 'UsersListComponent';

  showBanModal = false;
  selectedUser: any = null;
  banReason: string = '';

  constructor(
    private userService: UserService,
    private toastr: ToastrService,
    private navService: NavService,
    private router: Router,
    private route: ActivatedRoute,
    private chatService: ChatService,
    private loggingService: LoggingService,
    private elementRef: ElementRef,
    private subscriptionsService: SubscriptionsService,
    private socketService: SocketService
  ) {
    // Setup search debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.currentPage = 1; // Reset to first page on new search
      this.fetchUsers();
    });
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.activeDropdown = null;
    }
  }

  toggleDropdown(userId: string) {
    if (this.activeDropdown === userId) {
      this.activeDropdown = null;
    } else {
      this.activeDropdown = userId;
    }
  }

  isExpanded(userId: string, field: string): boolean {
    return this.expandedState[userId]?.has(field) ?? false;
  }

  toggleExpand(userId: string, field: string): void {
    if (!this.expandedState[userId]) {
      this.expandedState[userId] = new Set();
    }
    
    if (this.expandedState[userId].has(field)) {
      this.expandedState[userId].delete(field);
    } else {
      this.expandedState[userId].add(field);
    }
  }

  // Reset expanded states when fetching new data
  private resetExpandedStates() {
    this.expandedState = {};
  }

  ngOnInit(): void {
    this.fetchUsers();
    this.navService.setTitle('Users Overview');
    this.navService.setSubtitle('Manage your system users');
    
    // Subscribe to real-time user status updates
    this.socketService.getuserStatusUpdates().subscribe(update => {
      if (update && update.userId) {
        const userIndex = this.users.findIndex(user => user._id === update.userId);
        if (userIndex !== -1) {
          // Update the user's status
          this.users[userIndex] = {
            ...this.users[userIndex],
            status: update.status
          };
        }
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.socketService.getuserStatusUpdates().subscribe().unsubscribe();
  }

  fetchUsers(): void {
    this.loading = true;
    this.error = null;
    this.resetExpandedStates(); // Reset expanded states when fetching new data
    
    this.userService.getAllUsers(this.currentPage, this.itemsPerPage, this.searchTerm)
      .subscribe({
        next: (response) => {
          this.users = response.data.users;
          this.currentPage = response.data.pagination.currentPage;
          this.totalPages = response.data.pagination.totalPages;
          this.totalItems = response.data.pagination.totalItems;
          this.itemsPerPage = response.data.pagination.itemsPerPage;
          this.loading = false;
        },
        error: (error: any) => {
          this.error = error.error.message || 'An error occurred while fetching users';
          this.loading = false;
          this.toastr.error(this.error || 'An error occurred while fetching users');
        }
      });
  }

  onSearch(event: any): void {
    this.searchTerm = event.target.value;
    this.searchSubject.next(this.searchTerm);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.fetchUsers();
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    
    if (this.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, this.currentPage - 2);
      let end = Math.min(this.totalPages, start + maxVisiblePages - 1);
      
      if (end - start < maxVisiblePages - 1) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  async startChat(user: User): Promise<void> {
    try {
      // Create or get existing chat thread
      const response = await this.chatService.createOrGetChatThread(user._id).toPromise();
      
      if (response?.data) {
        // Set the active thread
        this.chatService.setActiveThread(response.data);

        // current route
        const currentRoute = this.router.url;
        
        // Navigate using absolute path
        this.router.navigate(['/dashboard/chat-admin'], { 
          queryParams: { threadId: response.data._id }
        });
      }
    } catch (error: any) {
      this.toastr.error(error.message || 'Failed to start chat');
    }
  }

  isAnyFieldExpanded(userId: string): boolean {
    return (this.expandedState[userId]?.size ?? 0) > 0;
  }

  showBanConfirmation(user: any) {
    this.selectedUser = user;
    this.showBanModal = true;
    this.banReason = ''; // Reset reason
    this.activeDropdown = null; // Close the dropdown
  }

  cancelBan() {
    this.showBanModal = false;
    this.selectedUser = null;
    this.banReason = ''; // Reset reason
  }

  confirmBan(): void {
    if (!this.selectedUser) return;

    this.userService.banUser(this.selectedUser._id, this.banReason).subscribe({
      next: (response) => {
        this.showBanModal = false;
        this.toastr.success(`${this.selectedUser.firstName} ${this.selectedUser.lastName} has been banned successfully.`);
        this.selectedUser = null;
        this.banReason = ''; // Reset reason
        // Refresh the users list
        this.fetchUsers();
      },
      error: (error) => {
        this.toastr.error(error.error.message || 'Failed to ban user');
        this.showBanModal = false;
        this.selectedUser = null;
        this.banReason = ''; // Reset reason
      }
    });
  }

  unbanUser(user: User): void {
    this.userService.unbanUser(user._id).subscribe({
      next: () => {
        this.toastr.success('User unbanned successfully');
        this.fetchUsers(); // Refresh the list
        this.activeDropdown = null; // Close the dropdown
      },
      error: (error) => {
        this.toastr.error(error.error.message || 'Error unbanning user');
      }
    });
  }

  // Gift Subscription Methods
  openGiftSubscriptionModal(user: any): void {
    this.selectedUser = user;
    this.showGiftSubscriptionModal = true;
    this.selectedSubscription = null;
    this.activeDropdown = null;
    this.fetchSubscriptions();
  }

  closeGiftSubscriptionModal(): void {
    this.showGiftSubscriptionModal = false;
    this.selectedUser = null;
    this.selectedSubscription = null;
  }

  fetchSubscriptions(): void {
    this.loadingSubscriptions = true;
    this.subscriptionsService.getSubscriptions().subscribe({
      next: (response) => {
        // Show all subscriptions for admin
        this.subscriptions = response.data;
        this.loadingSubscriptions = false;
      },
      error: (error) => {
        this.toastr.error(error.error.message || 'Error fetching subscriptions');
        this.loadingSubscriptions = false;
      }
    });
  }

  selectSubscription(subscription: any): void {
    // If clicking the same subscription, deselect it
    if (this.selectedSubscription === subscription) {
      this.selectedSubscription = null;
    } else {
      this.selectedSubscription = subscription;
    }
  }

  giftSubscription() {
    if (!this.selectedUser || !this.selectedSubscription) {
      return;
    }

    this.subscriptionsService.giftSubscription(
      this.selectedUser._id,
      this.selectedSubscription._id
    ).subscribe({
      next: (response) => {
        this.toastr.success('Subscription gifted successfully');
        this.closeGiftSubscriptionModal();
        // refresh user data
        this.fetchUsers();
      },
      error: (error) => {
        this.toastr.error(error.error.message || 'Failed to gift subscription');
      }
    });
  }
} 