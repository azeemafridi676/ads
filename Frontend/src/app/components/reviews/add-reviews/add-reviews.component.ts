import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ReviewService } from 'src/app/shared/service/review/review.service';
import { AuthService } from 'src/app/shared/service/Auth/Auth.service';
import { NavService } from 'src/app/shared/service/navbar/nav.service';

@Component({
  selector: 'app-add-reviews',
  templateUrl: './add-reviews.component.html',
  styleUrls: ['./add-reviews.component.scss']
})
export class AddReviewsComponent implements OnInit {
  reviewForm: FormGroup;
  maxRating = 5;
  ratings: number[] = Array(this.maxRating).fill(0).map((_, i) => i + 1);
  isSubmitting = false;
  userName: string = '';

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
    private authService: AuthService,
    private navService: NavService
  ) {
    this.reviewForm = this.fb.group({
      name: [{ value: '', disabled: true }],
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      duration: ['', [Validators.required]],
      comment: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });
  }

  ngOnInit() {
    this.navService.setTitle("Add Review");
    this.navService.setSubtitle("Add your review for our advertising services.");
    // Subscribe to user details from AuthService
    this.authService.user$.subscribe(user => {
      if (user) {
        this.userName = `${user.firstName} ${user.lastName}`;
        this.reviewForm.patchValue({
          name: this.userName
        });
      }
    });
  }

  onSubmit() {
    if (this.reviewForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      const reviewData = {
        ...this.reviewForm.getRawValue(), // Use getRawValue() to include disabled fields
        userId: this.authService.getCurrentUserId() // Add userId to the review data
      };
      
      this.reviewService.createReview(reviewData).subscribe({
        next: () => {
          this.router.navigate(['dashboard/reviews']);
        },
        error: (error) => {
          console.error('Error creating review:', error);
          this.isSubmitting = false;
        }
      });
    }
  }

  setRating(rating: number) {
    this.reviewForm.patchValue({ rating });
  }

  getCharacterCount(): number {
    return this.reviewForm.get('comment')?.value?.length || 0;
  }

  getRatingStars(rating: number): string {
    return '★'.repeat(rating);
  }

  cancelReview(): void {
    this.router.navigate(['dashboard/reviews']);
  }
}