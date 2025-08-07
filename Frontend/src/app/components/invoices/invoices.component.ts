import { Component } from '@angular/core';
import { Route } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { NavService } from 'src/app/shared/service/navbar/nav.service';
import { SubscriptionsService } from 'src/app/shared/service/subscriptions/subscriptions.service';

@Component({
  selector: 'app-invoices',
  templateUrl: './invoices.component.html',
  styleUrl: './invoices.component.scss'
})
export class InvoicesComponent {
  invoices: any;
  isLoading: boolean = true;
  constructor(
    private subscriptionService: SubscriptionsService,
    private toastr: ToastrService,
    private navService: NavService
  ) { }
  async ngOnInit() {
    this.getAllInvoices()
    this.navService.setTitle('Invoices Overview');
    this.navService.setSubtitle('Manage your ShowYourAdz invoices');
  }
  getAllInvoices(){
    this.isLoading = true;
    this.subscriptionService.getInvoices().subscribe({
      next: ((res:any) => {
        this.invoices = res.data || [];
        this.isLoading = false;
      }),
      error: (error) => {
        this.isLoading = false;
        this.toastr.error('Failed to load invoices');
      }
    })
  }

  formatDuration(days: number): string {
    if (days < 7) {
      return `${days} day${days > 1 ? 's' : ''}`;
    } else if (days < 30) {
      const weeks = Math.floor(days / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''}`;
    } else if (days < 365) {
      const months = Math.floor(days / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(days / 365);
      return `${years} year${years > 1 ? 's' : ''}`;
    }
  }
}
