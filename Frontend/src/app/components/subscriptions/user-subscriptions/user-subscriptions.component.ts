import { Component, OnInit, OnDestroy, ViewChildren, QueryList, ElementRef, AfterViewInit } from '@angular/core';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { SubscriptionsService } from 'src/app/shared/service/subscriptions/subscriptions.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/shared/service/Auth/Auth.service';
import { SocketService } from 'src/app/shared/service/socket/socket.service';
import { NavService } from 'src/app/shared/service/navbar/nav.service';
import { LoggingService } from 'src/app/shared/service/logging.service';
@Component({
  selector: 'app-user-subscriptions',
  templateUrl: './user-subscriptions.component.html',
  styleUrls: ['./user-subscriptions.component.scss']
})
export class UserSubscriptionsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChildren('descriptionText') descriptionElements!: QueryList<ElementRef>;
  @ViewChildren('currentDescriptionText') currentDescriptionElement!: QueryList<ElementRef>;
  selectedTab: string = 'monthly';
  userDetail:any = {
    currentSubscription: {
      needsExpansion: false,
      isDescriptionExpanded: false
    }
  };
  sessionId: string | null = null;
  sessionDetails: any = null;
  private stripe!: Stripe | null;
  public allPlans:any = [];
  private STRIPE_PUBLIC_KEY = environment.STRIPE_PUBLIC_KEY;
  loading: boolean = true;
  loadingPurchase: { [key: string]: boolean } = {};
  private readonly SOURCE = 'UserSubscriptionsComponent.ts';

  constructor(
    private router: Router,
    private subscriptionService:SubscriptionsService ,
    private route: ActivatedRoute,
    private toastr:ToastrService,
    private authService:AuthService,
    private socketService: SocketService,
    private navService: NavService,
    private loggingService: LoggingService
  ) {
  }

  async ngOnInit() {
    this.socketService.getConnectionStatus().subscribe(isConnected => {
      if (!isConnected) {
        this.socketService.reconnect();
      }
    });
    this.navService.setTitle('Subscriptions Overview');
    this.navService.setSubtitle('Manage your ShowYourAdz subscriptions');
    this.stripe = await loadStripe(this.STRIPE_PUBLIC_KEY);
    console.log(`${this.STRIPE_PUBLIC_KEY} ${(this.stripe)}`)
    this.loadUserDetails();
    this.getAllSubscriptions();
    this.setupSocketListeners();
  }

  private loadUserDetails() {
    this.subscriptionService.getCurrentSubscription().subscribe({
      next: (res: any) => {
        if (res) {
          if (res.data.currentSubscription) {
            res.data.currentSubscription.needsExpansion = false;
            res.data.currentSubscription.isDescriptionExpanded = false;
          }
          this.userDetail = res.data;
        }
      },
      error: (error) => {
        this.loggingService.log(this.SOURCE, 'Error fetching current subscription', error);
        this.toastr.error('Failed to load subscription details');
      }
    });
  }

  private setupSocketListeners() {
    this.socketService.getSubscriptionEvents().subscribe({
      next: (event) => {
        if (event?.type === 'subscription_updated') {
          this.handleSubscriptionUpdated(event);
        } else if (event?.type === 'subscription_purchased') {
          this.handleSubscriptionPurchased();
        } else if (event?.type === 'completion') {
          this.handleSubscriptionCompleted();
        }
      }
    });
  }

  private handleSubscriptionUpdated(event: any) {
    this.loggingService.log(this.SOURCE, 'Received subscription event', event);
    if (event?.type === 'subscription_updated') {
      const updatedSubscription = event.subscription;
      const metadata = event.metadata;

      // Only update if the subscription exists in userDetail
      if (this.userDetail?.currentSubscription?._id === updatedSubscription._id) {
        // Check if any relevant fields have changed
        const hasChanges = this.checkSubscriptionChanges(updatedSubscription, metadata);
        
        if (hasChanges) {
          // Update the subscription details
          this.userDetail.currentSubscription = {
            ...this.userDetail.currentSubscription,
            ...updatedSubscription
          };

          // Update subscription dates if they exist in metadata
          if (metadata?.nextBillingDate) {
            this.userDetail.subscriptionEndDate = metadata.nextBillingDate;
          }
          if (metadata?.renewedAt) {
            this.userDetail.subscriptionStartDate = metadata.renewedAt;
          }

          // Force change detection
          this.userDetail = { ...this.userDetail };
          
          // Show success message
          this.toastr.success('Subscription updated successfully');
        }
      }
    }
  }

  private checkSubscriptionChanges(updatedSubscription: any, metadata: any): boolean {
    const currentSub = this.userDetail?.currentSubscription;
    if (!currentSub) return false;

    // Check if any relevant fields have changed
    const fieldsToCheck = [
      'isCompleted',
      'isVisible',
      'currentCycles',
      'runCycleLimit'
    ];

    const hasFieldChanges = fieldsToCheck.some(field => 
      currentSub[field] !== updatedSubscription[field]
    );

    // Check if dates have changed
    const hasDateChanges = metadata?.nextBillingDate && 
      new Date(this.userDetail.subscriptionEndDate).getTime() !== new Date(metadata.nextBillingDate).getTime();

    return hasFieldChanges || hasDateChanges;
  }

  private handleSubscriptionCompleted() {
    // First update the current subscription status in userDetail
    if (this.userDetail?.currentSubscription) {
      this.userDetail.currentSubscription.isCompleted = true;
      this.userDetail.currentSubscription.completedAt = new Date().toISOString();
      // Force change detection by creating a new reference
      this.userDetail = { ...this.userDetail };
    }

    // Then update both subscription list and user details from server
    Promise.all([
      new Promise<void>((resolve) => {
        this.getAllSubscriptions();
        resolve();
      }),
      new Promise<void>((resolve) => {
        this.subscriptionService.getCurrentSubscription().subscribe({
          next: (res: any) => {
            if (res) {
              this.loggingService.log(this.SOURCE, 'Current subscription details fetched', res);
              if (res.data.currentSubscription) {
                res.data.currentSubscription.needsExpansion = false;
                res.data.currentSubscription.isDescriptionExpanded = false;
              }
              this.userDetail = res.data;
              resolve();
            }
          },
          error: () => resolve()
        });
      })
    ]).then(() => {
      // Force change detection
      this.checkDescriptionLengths();
      this.checkCurrentDescriptionLength();
    });
  }

  private handleSubscriptionPurchased() {
    Promise.all([
      new Promise<void>((resolve) => {
        this.getAllSubscriptions();
        resolve();
      }),
      new Promise<void>((resolve) => {
        this.subscriptionService.getCurrentSubscription().subscribe({
          next: (res: any) => {
            if (res) {
              this.loggingService.log(this.SOURCE, 'Current subscription details fetched', res);
              if (res.data.currentSubscription) {
                res.data.currentSubscription.needsExpansion = false;
                res.data.currentSubscription.isDescriptionExpanded = false;
              }
              this.userDetail = res.data;
              resolve();
            }
          },
          error: () => resolve()
        });
      })
    ]).then(() => {
      setTimeout(() => {
        this.toastr.success('Subscription purchased successfully!');
      }, 500);
      // Force change detection
      this.checkDescriptionLengths();
      this.checkCurrentDescriptionLength();
    });
  }

  getAllSubscriptions() {
    this.loading = true;
    this.subscriptionService.getSubscriptions().subscribe({
      next: ((res:any) => {
        this.allPlans = res.data;
        this.loading = false;
      }),
      error: (error: any) => {
        this.loading = false;
        this.toastr.error('Failed to load subscriptions');
      }
    })
  }

  ngOnDestroy() {
    // clear all subscriptions
    if (this.descriptionElements?.changes) {
      (this.descriptionElements.changes as any).unsubscribe();
    }
    if (this.currentDescriptionElement?.changes) {
      (this.currentDescriptionElement.changes as any).unsubscribe();
    }
  }

  ngAfterViewInit() {
    this.checkDescriptionLengths();
    // Re-check when plans change
    this.descriptionElements.changes.subscribe(() => {
      this.checkDescriptionLengths();
    });
    // Check current subscription description
    this.currentDescriptionElement.changes.subscribe(() => {
      this.checkCurrentDescriptionLength();
    });
  }

  checkDescriptionLengths() {
    setTimeout(() => {
      this.descriptionElements.forEach((el: ElementRef, index: number) => {
        if (this.allPlans[index]) {
          const element = el.nativeElement;
          // Check if content height is greater than 2 lines (assuming line-height is about 1.5)
          const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
          const maxHeight = lineHeight * 2;
          this.allPlans[index].needsExpansion = element.scrollHeight > maxHeight;
        }
      });
    });
  }

  checkCurrentDescriptionLength() {
    setTimeout(() => {
      const currentElement = this.currentDescriptionElement.first;
      if (currentElement && this.userDetail?.currentSubscription) {
        const element = currentElement.nativeElement;
        const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
        const maxHeight = lineHeight * 2;
        this.userDetail.currentSubscription.needsExpansion = element.scrollHeight > maxHeight;
      }
    });
  }

  toggleDescription(plan: any, event: Event) {
    event.stopPropagation();
    plan.isDescriptionExpanded = !plan.isDescriptionExpanded;
  }

  async purchasePlan(stripePlanId: string) {
    this.loadingPurchase[stripePlanId] = true;
    try {
      const data = {
        planId: stripePlanId
      }
      console.log('>>>>>>>>>>>>>data', data)
      this.subscriptionService.createCheckoutSession(data).subscribe({
        next: async (res: any) => {
          if (this.stripe && res.data) {
            console.log("redirecting to checkout", {sessionId: res.data.id})
            await this.stripe.redirectToCheckout({ sessionId: res.data.id });
            this.toastr.success(res.message)
          }
        },
        error: (err:any) => {
          console.log('>>>>>>>>>>>>>err', err)
          this.toastr.error(err.error.message || "some thing went wrong")
          this.loadingPurchase[stripePlanId] = false;
        },
        complete: () => {
          this.loadingPurchase[stripePlanId] = false;
        }
      });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      this.loadingPurchase[stripePlanId] = false;
    }
  }

  isSubscriptionCompleted(): boolean {
    return this.userDetail?.currentSubscription?.isCompleted || false;
  }

  isCurrentPlan(planId: string): boolean {
    return this.userDetail?.currentSubscription?.stripePlanId === planId;
  }

  hasPlansForSelectedPeriod(): boolean {
    return this.allPlans.some((plan: any) => 
      (plan.duration === 1 && this.selectedTab === 'monthly') || 
      (plan.duration === 12 && this.selectedTab === 'yearly')
    );
  }

  getNoPlansMessage(): string {
    return this.selectedTab === 'monthly' 
      ? 'No monthly subscription plans available at the moment. Please check our yearly plans or check back later.' 
      : 'No yearly subscription plans available at the moment. Please check our monthly plans or check back later.';
  }
}