# Auth Module (Electron Desktop App)

This document details the logic, structure, and flow of the authentication module in the Electron Angular desktop application. It covers the following components:
- Forget Password
- Login
- OTP Verification
- Reset Password
- Signup

Each component is described in terms of its TypeScript logic, HTML template, SCSS (if any), and test file.

---

## 1. Forget Password

### forget-password.component.ts
- **Purpose:** Handles the password recovery process by allowing users to request a password reset link via email.
- **Form:** Reactive form with a single `email` field, validated for required and email format.
- **Submission:**
  - On valid submission, sets `loading` to true and calls `authService.forgotPassword(email)`.
  - On success: shows a success toast, resets the form, disables loading.
  - On error: shows an error toast.
- **Dependencies:** Uses `FormBuilder`, `AuthService`, and `ToastrService`.
- **UI Imports:** CommonModule, ReactiveFormsModule, SpinnerComponent, RouterLink.

### forget-password.component.html
- **Layout:** Responsive form with branding, instructions, and email input.
- **Validation:** Shows error if email is invalid and touched/dirty.
- **Submit Button:** Shows spinner when loading, disables when loading.
- **Navigation:** Link to login page.
- **Social Login:** Google button (UI only, no logic shown).
- **Image:** Right-side illustration for large screens.

### forget-password.component.scss
- **Content:** Empty (no custom styles).

### forget-password.component.spec.ts
- **Test:** Checks that the component is created successfully.

---

## 2. Login

### login.component.ts
- **Purpose:** Handles user login.
- **Form:** Reactive form with `email` and `password` fields, both required, email validated.
- **Password Visibility:** `showPassword` toggles password field type.
- **Token Check:**
  - On init, checks for access and refresh tokens.
  - If present, verifies tokens via `authService.verifyToken`. If valid, navigates to `/welcome`.
- **Submission:**
  - On valid form, sets `loading` to true, calls `authService.login` with form values.
  - On success: shows success toast, stores verificationId, disables loading, navigates to `/otp`.
  - On error: shows error toast, disables loading.
  - On invalid form: shows error toast.
- **Dependencies:** `FormBuilder`, `AuthService`, `Router`, `ToastrService`, `LoggingService`.
- **UI Imports:** CommonModule, ReactiveFormsModule, SharedModule, RouterLink.

### login.component.html
- **Layout:** Responsive login form with branding and instructions.
- **Validation:** Shows error for invalid email/password.
- **Password Field:** Toggle visibility button.
- **Remember Me:** Checkbox (UI only).
- **Forgot Password:** Link to forgot password page.
- **Submit Button:** Shows spinner when loading, disables when loading.
- **Image:** Right-side illustration for large screens.

### login.component.scss
- **Content:** Empty (no custom styles).

### login.component.spec.ts
- **Test:** Checks that the component is created successfully.

---

## 3. OTP Verification

### otp.component.ts
- **Purpose:** Handles OTP (One-Time Password) verification after login/signup.
- **Form:** Reactive form with single `otp` field, required.
- **Submission:**
  - On valid form, sets `loading` to true, calls `authService.verifyOtp(otp)`.
  - On success: checks for access/refresh tokens, stores them, verifies tokens, shows success toast, navigates to `/app/create-connection` if valid, else to `/login`.
  - On error: shows error toast, disables loading.
- **Resend OTP:** Calls `authService.resendOtpCode`, shows toast on success/error, updates verificationId.
- **Dependencies:** `FormBuilder`, `AuthService`, `Router`, `ToastrService`, `LoggingService`.
- **UI Imports:** CommonModule, ReactiveFormsModule, SpinnerComponent, GobackComponent, RouterLink.

### otp.component.html
- **Layout:** Responsive form for OTP input.
- **Resend:** Button to resend OTP.
- **Submit Button:** Shows spinner when loading, disables when loading.
- **Image:** Right-side illustration for large screens.

### otp.component.scss
- **Content:** Empty (no custom styles).

### otp.component.spec.ts
- **Test:** Checks that the component is created successfully.

---

## 4. Reset Password

### reset-password.component.ts
- **Purpose:** Allows users to set a new password after receiving a reset link.
- **Form:** Reactive form with `password` and `confirmPassword` fields, both required.
- **Password Match:** Custom validator ensures both fields match.
- **Token:** Extracted from query params.
- **Submission:**
  - On valid form, calls `authService.resetPassword(token, password)`.
  - On success: navigates to `/login`.
  - On error: (toast commented out in code).
- **Password Visibility:** Toggles for both password fields.
- **Dependencies:** `FormBuilder`, `AuthService`, `Router`, `ActivatedRoute`.
- **UI Imports:** CommonModule, ReactiveFormsModule, RouterLink.

### reset-password.component.html
- **Layout:** Responsive form for new password and confirm password.
- **Validation:** Shows error if passwords do not match or are invalid.
- **Submit Button:** Disabled if form is invalid.
- **Navigation:** Link back to login page.
- **Image:** Right-side illustration for large screens.

### reset-password.component.scss
- **Content:** Empty (no custom styles).

### reset-password.component.spec.ts
- **Test:** Checks that the component is created successfully.

---

## 5. Signup

### signup.component.ts
- **Purpose:** Handles user registration.
- **Form:** Reactive form with fields: `firstName`, `lastName`, `phoneNumber`, `email`, `password`, `confirmPassword`, `privacyPolicy`.
- **Validation:**
  - `firstName`, `lastName`: required, custom name and SQL injection validators.
  - `phoneNumber`: required, numeric pattern.
  - `email`: required, email format.
  - `password`: required, min length 6.
  - `confirmPassword`: required, must match password (custom validator).
  - `privacyPolicy`: must be checked (requiredTrue).
- **Submission:**
  - On valid form, sets `loading` to true, calls `authService.signUp` with form values.
  - On success: shows success toast, stores verificationId, disables loading, navigates to `/otp`.
  - On error: shows error toast, disables loading.
  - On invalid form: marks form as dirty/touched.
- **Password Visibility:** Toggles for both password fields.
- **Dependencies:** `FormBuilder`, `AuthService`, `Router`, `ToastrService`, `LoggingService`.
- **UI Imports:** CommonModule, ReactiveFormsModule, SpinnerComponent, RouterLink.

### signup.component.html
- **Layout:** Responsive registration form with branding and instructions.
- **Validation:** Shows errors for each field as appropriate.
- **Password Fields:** Toggle visibility buttons.
- **Privacy Policy:** Checkbox required.
- **Submit Button:** Shows spinner when loading, disables when loading.
- **Navigation:** Link to login page.
- **Social Login:** Google button (UI only, no logic shown).
- **Image:** Left-side illustration for large screens.

### signup.component.scss
- **Content:** Empty (no custom styles).

### signup.component.spec.ts
- **Test:** Checks that the component is created successfully.

---

## Integration Points
- All components use Angular's standalone component pattern.
- All forms use Angular Reactive Forms for validation and state management.
- All service calls are made via `AuthService` (login, signup, forgot password, reset password, OTP verification, resend OTP).
- User feedback is provided via `ToastrService` for success/error notifications.
- UI is styled with Tailwind CSS utility classes in templates.
- SpinnerComponent is used for loading states.
- Navigation is handled via Angular Router.

## Logging and Unclear Data Handling
- All service interactions assume standard observable patterns. If the structure of service responses or error objects is unclear, insert logging in the service or component to capture the actual data structure at runtime.
- If you need to clarify the structure of any data returned by AuthService methods (login, signUp, forgotPassword, verifyOtp, resetPassword, resendOtpCode), add a log statement and run the app to capture:
  - The full response object on success
  - The full error object on failure
  - The structure of any tokens or verification IDs returned

## Testing
- Each component has a basic test to ensure it is created successfully. No further logic is tested in the provided spec files.

---

This documentation covers the complete logic and flow of the Auth module in the Electron Angular desktop application, including all user-facing forms, validation, service interactions, and UI structure. 