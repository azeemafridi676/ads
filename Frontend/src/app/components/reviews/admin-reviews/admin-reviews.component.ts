import { Component, OnInit } from '@angular/core';
import { ReviewService, Review } from 'src/app/shared/service/review/review.service';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { NavService } from "src/app/shared/service/navbar/nav.service";
import { LoggingService } from "src/app/shared/service/logging.service";

@Component({
  selector: 'app-admin-reviews',
  templateUrl: './admin-reviews.component.html',
  styleUrls: ['./admin-reviews.component.scss']
})
export class AdminReviewsComponent implements OnInit {
  reviews: Review[] = [];
  isLoading = true;
  isUpdating = false;
  isDeleting = false;
  showDeleteModal = false;
  reviewToDelete: Review | null = null;
  private readonly SOURCE = 'admin-reviews.component.ts';
  private initialsCache = new Map<string, string>();
  
  constructor(
    private reviewService: ReviewService, 
    private navService: NavService, 
    private loggingService: LoggingService
  ) {}

  ngOnInit(): void {
    this.loadReviews();
    this.navService.setTitle("Manage Reviews");
    this.navService.setSubtitle("Manage and moderate user reviews for our advertising services.");
  }

  loadReviews(): void {
    this.isLoading = true;
    this.reviewService.getAllReviews().pipe(
      map(response => response.data),
      catchError((error: Error) => {
        console.error('Error loading reviews:', error);
        return of([]);
      })
    ).subscribe(reviews => {
      this.reviews = reviews;
      this.isLoading = false;
    });
  }

  getInitials(name: string): string {
    if (this.initialsCache.has(name)) {
      return this.initialsCache.get(name)!;
    }
    
    this.loggingService.log(this.SOURCE, `Getting initials for name: ${name}`);
    const initials = name
      .split(' ')
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase();
    
    this.initialsCache.set(name, initials);
    return initials;
  }

  getRatingStars(rating: number): string {
    return '★'.repeat(rating);
  }

  getStatusColor(status: Review['status']): string {
    switch(status) {
      case 'approved':
        return 'text-[#10b981] bg-[#ecfdf5] border border-[#10b981]';
      case 'pending':
        return 'text-[#f59e0b] bg-[#fffbeb] border border-[#f59e0b]';
      case 'rejected':
        return 'text-[#ef4444] bg-[#fef2f2] border border-[#ef4444]';
      default:
        return 'text-gray-600 bg-gray-100 border border-gray-300';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  formatStatus(status: Review['status']): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  truncateName(name: string): string {
    const maxLength = 20;
    if (name.length <= maxLength) {
      return name;
    }
    return name.substring(0, maxLength) + '...';
  }

  updateReviewStatus(reviewId: string, status: 'approved' | 'rejected'): void {
    if (this.isUpdating) return;

    this.isUpdating = true;
    this.reviewService.updateReviewStatus(reviewId, status).pipe(
      catchError((error: Error) => {
        console.error('Error updating review status:', error);
        return of(null);
      })
    ).subscribe(response => {
      this.isUpdating = false;
      if (response) {
        this.loadReviews();
      }
    });
  }

  openDeleteModal(review: Review): void {
    this.reviewToDelete = review;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.reviewToDelete = null;
    this.showDeleteModal = false;
  }

  confirmDelete(): void {
    if (!this.reviewToDelete || this.isDeleting) return;

    this.isDeleting = true;
    this.reviewService.deleteReview(this.reviewToDelete._id).pipe(
      catchError((error: Error) => {
        console.error('Error deleting review:', error);
        return of(null);
      })
    ).subscribe(response => {
      this.isDeleting = false;
      this.showDeleteModal = false;
      this.reviewToDelete = null;
      
      if (response) {
        this.loadReviews();
      }
    });
  }
} 