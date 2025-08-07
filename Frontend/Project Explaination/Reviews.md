# Reviews Module Documentation

## Overview
The Reviews module manages user reviews for advertising services. It includes components for adding, editing, listing, and administrating reviews. The module integrates with review, authentication, navigation, and notification services.

---

## 1. `add-reviews` Component

### Purpose
Allows users to submit a new review for the advertising service. Pre-fills the user's name, collects rating, campaign duration, and comment.

### Logic
- **State Management**:
  - `reviewForm`: Reactive form for review fields (name, rating, duration, comment).
  - `isSubmitting`: Indicates if the form is being submitted.
  - `userName`: Stores the current user's name.
  - `ratings`, `durations`: Arrays for rating stars and duration options.
- **Lifecycle**:
  - `ngOnInit()`: Sets navigation titles and subscribes to user details to pre-fill the name.
- **Core Methods**:
  - `onSubmit()`: Submits the review to the backend. Uses `getRawValue()` to include disabled fields.
  - `setRating()`: Updates the rating value in the form.
  - `getCharacterCount()`, `getRatingStars()`: Helpers for UI display.
  - `cancelReview()`: Navigates back to the reviews dashboard.
- **Error Handling**:
  - Uses console logging for errors.
- **UI**:
  - Form with name, rating, duration, comment, and action buttons. Shows validation and loading states.

---

## 2. `admin-reviews` Component

### Purpose
Allows administrators to view, approve, reject, and delete user reviews. Displays review details and status.

### Logic
- **State Management**:
  - `reviews`: Array of review objects.
  - `isLoading`, `isUpdating`, `isDeleting`: Loading and action states.
  - `showDeleteModal`, `reviewToDelete`: Modal and deletion state.
  - `initialsCache`: Caches initials for user names.
- **Lifecycle**:
  - `ngOnInit()`: Loads reviews and sets navigation titles.
- **Core Methods**:
  - `loadReviews()`: Fetches all reviews from the backend.
  - `getInitials()`, `getRatingStars()`, `getStatusColor()`, `formatDate()`, `formatStatus()`, `truncateName()`: Helpers for UI display.
  - `updateReviewStatus()`: Approves or rejects a review.
  - `openDeleteModal()`, `cancelDelete()`, `confirmDelete()`: Handles review deletion.
- **Error Handling**:
  - Uses console logging for errors.
- **UI**:
  - Review cards with user info, rating, status, comment, and action buttons. Delete confirmation modal and empty state.

---

## 3. `edit-reviews` Component

### Purpose
Allows users to edit their submitted reviews, unless the review is already approved. Pre-fills the form with existing review data.

### Logic
- **State Management**:
  - `reviewForm`: Reactive form for review fields.
  - `isSubmitting`, `isApprovedReview`: Submission and approval state.
  - `reviewId`, `userName`, `errorMessage`: Review identification and error state.
  - `ratings`, `durations`: Arrays for rating stars and duration options.
- **Lifecycle**:
  - `ngOnInit()`: Sets navigation titles, subscribes to user details, and loads review data by ID.
- **Core Methods**:
  - `onSubmit()`: Submits the updated review to the backend. Disables editing if review is approved.
  - `setRating()`: Updates the rating value in the form.
  - `getCharacterCount()`, `getRatingStars()`: Helpers for UI display.
  - `cancelEdit()`: Navigates back to the reviews dashboard.
- **Error Handling**:
  - Uses console logging for errors. Displays error messages for forbidden edits.
- **UI**:
  - Form with name, rating, duration, comment, and action buttons. Shows validation, error, and loading states.

---

## 4. `list-reviews` Component

### Purpose
Displays a list of the user's reviews, with options to add, edit, or delete reviews. Shows review details and status.

### Logic
- **State Management**:
  - `reviews`: Array of review objects.
  - `isLoading`, `showDeleteModal`, `isDeleting`: Loading and modal states.
  - `reviewToDelete`: Review selected for deletion.
  - `initialsCache`: Caches initials for user names.
- **Lifecycle**:
  - `ngOnInit()`: Loads reviews and sets navigation titles.
- **Core Methods**:
  - `loadReviews()`: Fetches user's reviews from the backend.
  - `getInitials()`, `truncateName()`, `getRatingStars()`, `getStatusColor()`, `formatDate()`, `formatStatus()`: Helpers for UI display.
  - `navigateToAddReview()`, `editReview()`: Navigation for adding/editing reviews.
  - `openDeleteModal()`, `cancelDelete()`, `confirmDelete()`: Handles review deletion.
- **Error Handling**:
  - Uses console logging for errors.
- **UI**:
  - Review cards with user info, rating, status, comment, and action buttons. Add review button, delete confirmation modal, and empty state.

---

## 5. SCSS and Spec Files
- SCSS files provide styling for each component. No business logic.
- Spec files are for unit testing component creation. No business logic.

---

## 6. Service and Data Structure Uncertainty
If any service method or data structure is unclear, a log statement must be inserted in the relevant file. The user must run the code and provide the following log output:
- The full output of the log statement(s) inserted.
- The context in which the log was triggered (e.g., which action or user flow).

---

## End of Reviews Module Documentation 