# Auth Module Documentation

## Overview
The Auth module handles all authentication-related user flows, including login, signup, password reset, OTP verification, and Google OAuth callback. It consists of several Angular components, each responsible for a specific part of the authentication process. Below is a detailed breakdown of each file and its logic.

---

## 1. `auth-callback.component.ts` & `auth-callback.component.html`

### Purpose
Handles the callback from Google OAuth authentication. Processes query parameters from the URL, manages error states, and redirects users based on authentication results.

### Logic
- **Initialization (`ngOnInit`)**: 
  - Logs component initialization.
  - Subscribes to query parameters from the route.
  - Extracts `accessToken`, `refreshToken`, and `error` from the query params.
  - If `error` exists:
    - Sets the error state.
    - If error is `'notfound'`, stores user data from params for possible signup.
  - If both tokens exist:
    - Calls `authService.handleGoogleCallback` with tokens.
    - Decodes the user token and redirects based on user role (`admin` or regular user).
  - If neither tokens nor error, redirects to login.
- **Signup/Back to Login**:
  - `goToSignup()`: Navigates to signup, passing Google user data if available.
  - `goToLogin()`: Navigates to login page.

### UI States (`auth-callback.component.html`)
- Loading spinner while processing.
- Error state for account not found (with signup option).
- Error state for server error (with retry option).

---

## 2. `forget-password.component.ts` & `forget-password.component.html`

### Purpose
Allows users to request a password reset by entering their email address.

### Logic
- **Form Setup**: Uses Angular Reactive Forms to validate email input.
- **Submission (`onSubmit`)**:
  - If form is valid:
    - Sets loading state.
    - Calls `authService.forgotPassword` with the email.
    - On success: Shows success toast, resets form, disables loading.
    - On error: Shows error toast.

### UI (`forget-password.component.html`)
- Email input with validation.
- Submit button with loading spinner.
- Link to login page.
- Option to continue with Google.
- Responsive layout with image on large screens.

---

## 3. `login.component.ts` & `login.component.html`

### Purpose
Handles user login with email/password and Google OAuth. Displays ban modal if account is banned.

### Logic
- **Initialization (`ngOnInit`)**:
  - If user is already authenticated, redirects to dashboard (admin or user).
- **Form Setup**: Reactive form with email and password fields.
- **Submission (`onSubmit`)**:
  - If form is valid:
    - Sets loading state.
    - Calls `authService.login` with form data.
    - On success: Shows success toast, stores verification ID, navigates to OTP page.
    - On error: If banned, shows ban modal with details; otherwise, shows error toast.
  - If form invalid: Shows error toast.
- **Password Visibility**: Toggle for showing/hiding password.
- **Google Login**: Calls `authService.initiateGoogleAuth`.

### UI (`login.component.html`)
- Email and password inputs with validation.
- Remember me and forgot password options.
- Submit button with loading spinner.
- Google login button.
- Ban modal with reason and date if account is banned.

---

## 4. `otp.component.ts` & `otp.component.html`

### Purpose
Handles OTP (One-Time Password) verification after login or signup.

### Logic
- **Form Setup**: Reactive form for OTP input.
- **Submission (`onSubmit`)**:
  - If form is valid:
    - Sets loading state.
    - Calls `authService.verifyOtp` with OTP.
    - On success: Stores tokens, shows success toast, redirects based on user role.
    - On error: Shows error toast.
  - If form invalid: Shows error toast.
- **Resend OTP**: Calls `authService.resendOtpCode` and updates verification ID on success.

### UI (`otp.component.html`)
- OTP input with validation.
- Resend code option.
- Submit button with loading spinner.
- Responsive layout with image on large screens.

---

## 5. `reset-password.component.ts` & `reset-password.component.html`

### Purpose
Allows users to set a new password after receiving a reset link.

### Logic
- **Form Setup**: Reactive form for new password and confirm password, with custom validator for matching.
- **Initialization**: Reads reset token from query params.
- **Submission (`onSubmit`)**:
  - If form is valid:
    - Calls `authService.resetPassword` with token and new password.
    - On success: Shows success toast, navigates to login.
    - On error: Shows error toast.
- **Password Visibility**: Toggles for both password fields.

### UI (`reset-password.component.html`)
- New password and confirm password inputs with validation.
- Submit button.
- Link to login page.
- Responsive layout with image on large screens.

---

## 6. `signup.component.ts` & `signup.component.html`

### Purpose
Handles user registration with email/password and Google OAuth. Enforces privacy policy agreement.

### Logic
- **Form Setup**: Reactive form with fields for name, email, phone, password, confirm password, and privacy policy agreement. Uses custom validators for names and password match.
- **Initialization**: If Google signup, pre-fills form with Google data from query params.
- **Submission (`onSubmit`)**:
  - If form is valid:
    - Sets loading state.
    - Calls `authService.signUp` with form data.
    - On success: Shows success toast, stores verification ID, navigates to OTP page.
    - On error: Shows error toast.
  - If form invalid: Marks form as dirty and touched.
- **Password Visibility**: Toggles for both password fields.
- **Google Signup**: Calls `authService.initiateGoogleAuth` with signup parameter.

### UI (`signup.component.html`)
- Inputs for all required fields with validation.
- Privacy policy agreement checkbox.
- Submit button with loading spinner.
- Google signup button.
- Responsive layout with image on large screens.

---

## 7. SCSS and Spec Files
- SCSS files provide styling for each component. No business logic.
- Spec files are for unit testing component creation. No business logic.

---

## 8. Service and Data Structure Uncertainty
If any service method or data structure is unclear, a log statement must be inserted in the relevant file. The user must run the code and provide the following log output:
- The full output of the log statement(s) inserted.
- The context in which the log was triggered (e.g., which action or user flow).

---

## End of Auth Module Documentation 