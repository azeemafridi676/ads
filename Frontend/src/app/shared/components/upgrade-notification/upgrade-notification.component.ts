import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { UpgradeNotificationService } from '../../service/upgrade-notifiication/upgrade-notificatiion.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-upgrade-notification',
  templateUrl: './upgrade-notification.component.html',
  animations: [
    trigger('slideDown', [
      state('void', style({ 
        transform: 'translateY(-100%)',
        opacity: 0
      })),
      state('*', style({ 
        transform: 'translateY(0)',
        opacity: 1
      })),
      transition('void => *', animate('300ms ease-out')),
      transition('* => void', animate('200ms ease-in'))
    ])
  ]
})
export class UpgradeNotificationComponent implements OnInit, OnDestroy {
  show = false;
  heading = '';
  subheading = '';
  private subscription: Subscription = new Subscription();
  private autoHideTimer: any;

  constructor(
    private upgradeNotificationService: UpgradeNotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.subscription = this.upgradeNotificationService.notification$.subscribe(notification => {
      this.show = notification.show;
      this.heading = notification.heading;
      this.subheading = notification.subheading;

      // Clear any existing timer
      if (this.autoHideTimer) {
        clearTimeout(this.autoHideTimer);
      }

      // Set new timer if autoHide is true
      if (notification.autoHide && notification.show) {
        this.autoHideTimer = setTimeout(() => {
          this.close();
        }, 5000);
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.autoHideTimer) {
      clearTimeout(this.autoHideTimer);
    }
  }

  close() {
    this.upgradeNotificationService.hideUpgradeNotification();
  }

  onUpgradeClick() {
    this.close();
    this.router.navigate(['/dashboard/subscriptions']);
  }
}