import { Component, OnInit } from '@angular/core';
import { SubscriptionsService } from 'src/app/shared/service/subscriptions/subscriptions.service';
import { HomeService, Review, Stats, PaginatedResponse } from '../../shared/service/home/home.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
  
@Component({
  selector: 'app-pricing',
  templateUrl: './pricing.component.html',
  styleUrls: ['./pricing.component.scss']
})
export class PricingComponent implements OnInit {
  allPlans: any[] = [];
  reviews: Review[] = [];
  stats: Stats[] = [];
  isLoading = true;
  isLoadingPlans = true;
  currentPage = 1;
  currentPlanPage = 1;
  itemsPerPage = 6;
  totalItems = 0;
  totalPlanItems = 0;
  totalPages = 1;
  totalPlanPages = 1;

  constructor(
    private subscriptionService: SubscriptionsService,
    private homeService: HomeService
  ) {
    this.stats = this.homeService.getStats();
  }

  ngOnInit(): void {
    this.getAllSubscriptions();
    this.loadReviews();
  }

  getAllSubscriptions() {
    this.isLoadingPlans = true;
    this.subscriptionService.getPublicSubscriptions(this.currentPlanPage, this.itemsPerPage).subscribe({
      next: ((res:any) => {
        this.allPlans = res.data.subscriptions;
        this.totalPlanItems = res.data.total;
        this.totalPlanPages = Math.ceil(this.totalPlanItems / this.itemsPerPage);
        this.isLoadingPlans = false;
      }),
      error: (error) => {
        console.error('Error loading plans:', error);
        this.isLoadingPlans = false;
      }
    });
  }

  nextPlanPage() {
    if (this.currentPlanPage < this.totalPlanPages) {
      this.currentPlanPage++;
      this.getAllSubscriptions();
    }
  }

  previousPlanPage() {
    if (this.currentPlanPage > 1) {
      this.currentPlanPage--;
      this.getAllSubscriptions();
    }
  }

  loadReviews() {
    this.isLoading = true;
    this.homeService.getApprovedReviews(this.currentPage, this.itemsPerPage)
      .pipe(
        catchError(error => {
          console.error('Error loading reviews:', error);
          return of({ status: 'error', data: [], total: 0, page: 1, limit: this.itemsPerPage } as PaginatedResponse<Review>);
        })
      )
      .subscribe(response => {
        this.reviews = response.data;
        this.totalItems = response.total;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        this.isLoading = false;
      });
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadReviews();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadReviews();
    }
  }

  getInitials(name: string): string {
    return this.homeService.getInitials(name);
  }

  truncateName(name: string): string {
    return this.homeService.truncateName(name);
  }

  getRatingStars(rating: number): string {
    return this.homeService.getRatingStars(rating);
  }

  formatDate(date: Date | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}
