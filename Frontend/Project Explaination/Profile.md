# Profile Component Documentation

## Overview
The Profile component allows users to view and update their profile information, change their password, and delete their account. It manages user data, form state, and interacts with authentication and navigation services.

---

## 1. `profile.component.ts`

### Purpose
Handles the logic for displaying and updating user profile information, changing passwords, and deleting the account. Manages modal visibility, form state, and communicates with the backend via the `AuthService`.

### Logic
- **State Management**:
  - `profileForm`: Reactive form for user profile fields (name, email, DOB, phone, image).
  - `passwordForm`: Reactive form for password change (current, new, confirm).
  - `userData`: Holds the current user data.
  - `profileBinaryFile`: Stores the selected profile image file.
  - `loading`: Boolean indicating loading state for UI feedback.
  - `showPasswordModal`: Controls the visibility of the change password modal.
  - `showDeleteModal`: Controls the visibility of the delete account modal.
  - `lastUpdateDate`: Stores the formatted last update date for display.

- **Lifecycle**:
  - `ngOnInit()`: Fetches user details and sets navigation titles. Populates the form with user data.

- **Core Methods**:
  - `onSave()`: Submits updated profile data to the backend. Handles file uploads and updates form state.
  - `onFileChange(event)`: Handles profile image selection and updates the form.
  - `openFileSelect()`: Triggers the file input dialog for profile image selection.
  - `openChangePasswordModal()`, `closeChangePasswordModal()`: Manage password modal visibility.
  - `onChangePassword()`: Submits password change request to the backend.
  - `openDeleteAccountModal()`, `closeDeleteAccountModal()`: Manage delete account modal visibility.
  - `deleteAccount()`: Submits account deletion request to the backend.
  - `logout()`: Logs the user out and navigates to login.
  - `formatDateForInput(dateString)`, `formatLastUpdateDate(dateString)`: Utility methods for date formatting.

- **Error Handling**:
  - Uses `ToastrService` to display error messages for failed operations.

---

## 2. `profile.component.html`

### Purpose
Defines the UI for viewing and editing profile information, changing password, and deleting the account.

### Logic
- **Profile Display**: Shows user image, name, and last update date.
- **Profile Form**: Inputs for name, email, DOB, phone, and image upload. Save button triggers profile update.
- **Change Password Modal**: Form for current, new, and confirm password. Submit triggers password change.
- **Delete Account Modal**: Confirmation dialog for account deletion.
- **Logout Button**: Triggers logout logic.
- **Responsive Layout**: Uses Tailwind CSS classes for layout and styling.

---

## 3. `profile.component.scss`
- Contains component-specific styles. No business logic.

---

## 4. Spec File
- Contains unit tests for component creation. No business logic.

---

## 5. Service and Data Structure Uncertainty
If any service method or data structure is unclear, a log statement must be inserted in the relevant file. The user must run the code and provide the following log output:
- The full output of the log statement(s) inserted.
- The context in which the log was triggered (e.g., which action or user flow).

---

## End of Profile Component Documentation 