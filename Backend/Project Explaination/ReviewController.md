# Review Controller Documentation (`reviewController.ts`)

## Overview
Implements all business logic for review-related API endpoints. Handles review creation, retrieval, update, deletion, approval, rejection, and public display. Integrates with the Review model.

---

## 1. Create Review
- `createReview`: Creates a new review for the authenticated user.

---

## 2. Get User Reviews
- `getUserReviews`: Retrieves all reviews for the authenticated user.

---

## 3. Get All Reviews (Admin)
- `getAllReviews`: Admin retrieves all reviews, populates user info.

---

## 4. Update Review Status (Admin)
- `updateReviewStatus`: Admin updates the status (approved/rejected) of a review.

---

## 5. Delete Review
- `deleteReview`: Deletes a review by ID. Admin can delete any review; users can delete their own.

---

## 6. Get Review by ID
- `getReviewById`: Retrieves a review by ID, validates ownership.

---

## 7. Update Review
- `updateReview`: Updates a review by ID, validates ownership and status.

---

## 8. Get Approved Reviews (Public)
- `getApprovedReviews`: Retrieves paginated, approved reviews for public display.

---

## Error Handling
- All controller functions handle errors and return appropriate HTTP status codes and messages.

---

## Notes
- Integrates with the Review model.
- For any unclear model or business logic, insert a log statement and instruct the user to provide:
  - The full object or value returned by the model or business logic.
  - The values of any relevant variables at the point of logging.

---

# End of Review Controller Documentation 