import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ReviewService, Review, ApiResponse } from 'src/app/shared/service/review/review.service';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { NavService } from 'src/app/shared/service/navbar/nav.service';

@Component({
  selector: 'app-list-reviews',
  templateUrl: './list-reviews.component.html',
  styleUrls: ['./list-reviews.component.scss']
})
export class ListReviewsComponent implements OnInit {
  reviews: Review[] = [];
  isLoading = true;
  showDeleteModal = false;
  isDeleting = false;
  reviewToDelete: Review | null = null;
  private initialsCache = new Map<string, string>();

  constructor(
    private router: Router,
    private reviewService: ReviewService,
    private navService: NavService
  ) { }

  ngOnInit(): void {
    this.loadReviews();
    this.navService.setTitle("My Reviews");
    this.navService.setSubtitle("Manage and view your reviews for our advertising services.");
  }

  loadReviews(): void {
    this.isLoading = true;
    this.reviewService.getReviews().pipe(
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
    
    const initials = name
      .split(' ')
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase();
    
    this.initialsCache.set(name, initials);
    return initials;
  }

  truncateName(name: string): string {
    const maxLength = 20;
    if (name.length <= maxLength) {
      return name;
    }
    return name.substring(0, maxLength) + '...';
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

  navigateToAddReview(): void {
    this.router.navigate(['dashboard/add-review']);
  }

  editReview(reviewId: string): void {
    // Check if review exists and is not approved
    const review = this.reviews.find(r => r._id === reviewId);
    if (!review || review.status === 'approved') return;
    
    this.router.navigate(['/dashboard/edit-review', reviewId]);
  }

  openDeleteModal(review: Review): void { 
    // Don't open modal if review is approved
    if (review.status === 'approved') return;
    
    this.reviewToDelete = review;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.reviewToDelete = null;
    this.showDeleteModal = false;
  }

  confirmDelete(): void {
    if (!this.reviewToDelete || this.isDeleting || this.reviewToDelete.status === 'approved') return;

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