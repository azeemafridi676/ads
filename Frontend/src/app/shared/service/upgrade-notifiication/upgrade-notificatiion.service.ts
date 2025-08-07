import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface UpgradeNotification {
  show: boolean;
  heading: string;
  subheading: string;
  autoHide?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UpgradeNotificationService {
  private notificationSubject = new BehaviorSubject<UpgradeNotification>({
    show: false,
    heading: '',
    subheading: ''
  });

  notification$ = this.notificationSubject.asObservable();

  showUpgradeNotification(notification: UpgradeNotification) {
    this.notificationSubject.next(notification);
    
    if (notification.autoHide) {
      setTimeout(() => {
        this.hideUpgradeNotification();
      }, 10000); // Hide after 10 seconds
    }
  }

  hideUpgradeNotification() {
    this.notificationSubject.next({
      show: false,
      heading: '',
      subheading: ''
    });
  }
}