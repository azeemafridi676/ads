import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ReviewService, Review } from 'src/app/shared/service/review/review.service';
import { AuthService } from 'src/app/shared/service/Auth/Auth.service';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { NavService } from 'src/app/shared/service/navbar/nav.service';

@Component({
  selector: 'app-edit-reviews',
  templateUrl: './edit-reviews.component.html',
  styleUrls: ['./edit-reviews.component.scss']
})
export class EditReviewsComponent implements OnInit {
  reviewForm: FormGroup;
  maxRating = 5;
  ratings: number[] = Array(this.maxRating).fill(0).map((_, i) => i + 1);
  isSubmitting = false;
  reviewId: string;
  userName: string = '';
  errorMessage: string = '';
  isApprovedReview: boolean = false;

  durations: string[] = [
    '1 week',
    '2 weeks',
    '1 month',
    '2 months',
    '3 months',
    '6 months'
  ];

  constructor(
    private fb: FormBuilder,
    private reviewService: ReviewService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private navService: NavService
  ) {
    this.reviewForm = this.fb.group({
      name: [{ value: '', disabled: true }],
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      duration: ['', [Validators.required]],
      comment: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });

    this.reviewId = this.route.snapshot.params['id'];
  }

  ngOnInit() {
    this.navService.setTitle("Edit Review");
    this.navService.setSubtitle("Edit your review for our advertising services.");
    // Get user details
    this.authService.user$.subscribe(user => {
      if (user) {
        this.userName = `${user.firstName} ${user.lastName}`;
        this.reviewForm.patchValue({
          name: this.userName
        });
      }
    });
    // Load existing review data
    if (this.reviewId) {
      this.reviewService.getReviewById(this.reviewId).pipe(
        map(response => response.data),
        catchError((error: Error) => {
          console.error('Error loading review:', error);
          this.router.navigate(['components/reviews']);
          return of(null);
        })
      ).subscribe((review: Review | null) => {
        if (review) {
          this.isApprovedReview = review.status === 'approved';
          if (this.isApprovedReview) {
            this.reviewForm.disable();
            this.errorMessage = 'This review has been approved and cannot be edited.';
          }
          this.reviewForm.patchValue({
            rating: review.rating,
            duration: review.duration,
            comment: review.comment
          });
        }
      });
    }
  }

  onSubmit() {
    if (this.reviewForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.errorMessage = '';
      
      const reviewData: Partial<Review> = {
        ...this.reviewForm.getRawValue(),
        userId: this.authService.getCurrentUserId() || ''
      };
      
      this.reviewService.updateReview(this.reviewId, reviewData).pipe(
        map(response => response.data),
        catchError((error: any) => {
          console.error('Error updating review:', error);
          this.isSubmitting = false;
          if (error.error?.message === 'Cannot edit an approved review') {
            this.errorMessage = 'This review has been approved and cannot be edited.';
            this.reviewForm.disable();
            this.isApprovedReview = true;
          } else {
            this.errorMessage = 'An error occurred while updating the review. Please try again.';
          }
          return of(null);
        })
      ).subscribe((review: Review | null) => {
        if (review) {
          this.router.navigate(['dashboard/reviews']);
        }
      });
    }
  }

  setRating(rating: number) {
    if (!this.isApprovedReview) {
      this.reviewForm.patchValue({ rating });
    }
  }

  getCharacterCount(): number {
    return this.reviewForm.get('comment')?.value?.length || 0;
  }

  getRatingStars(rating: number): string {
    return '★'.repeat(rating);
  }

  cancelEdit(): void {
    this.router.navigate(['dashboard/reviews']);
  }
} 