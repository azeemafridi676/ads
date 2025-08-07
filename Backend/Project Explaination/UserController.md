# User Controller Documentation (`userController.ts`)

## Overview
Implements all business logic for user-related API endpoints. Handles signup, login, OTP, token verification, password reset, profile management, admin actions (ban/unban), Google OAuth, and account deletion. Integrates with the User model and related services.

---

## 1. Signup and Login
- `signup`: Registers a new user, hashes password, sends OTP and welcome email.
- `login`: Authenticates user, checks ban status, sends OTP.
- `resendOtp`: Resends OTP for login.
- `verifyOtp`: Verifies OTP and issues tokens.
- `verifyToken`: Verifies access/refresh tokens, refreshes if needed.

---

## 2. Password Management
- `forgotPassword`: Sends password reset email with token.
- `resetPassword`: Resets password using token.
- `changePassword`: Changes password for authenticated user.

---

## 3. Profile Management
- `updateProfile`: Updates user profile fields and profile image.
- `getUserProfile`: Retrieves user profile by ID, marks user as online.
- `deleteAccount`: Deletes user account and disconnects socket.

---

## 4. Admin Actions
- `getAllUsers`: Admin fetches paginated, searchable user list.
- `banUser`: Admin bans a user, sets ban reason, disconnects socket.
- `unbanUser`: Admin unbans a user.
- `checkAdminStatus`: Checks if any admin is online.

---

## 5. Logout
- `logout`: Disconnects user socket.

---

## 6. Google OAuth
- `googleAuth`: Initiates Google OAuth flow with purpose (login/signup).
- `googleCallback`: Handles Google OAuth callback, issues tokens or creates user.

---

## 7. Helper Functions
- `issueTokens`: Issues JWT access and refresh tokens.
- `generateRandomIdAndOtp`: Generates verification ID and OTP.

---

## Error Handling
- All controller functions handle errors and return appropriate HTTP status codes and messages.

---

## Notes
- Integrates with User model and related services (email, file upload, socket, token).
- For any unclear model, service, or business logic, insert a log statement and instruct the user to provide:
  - The full object or value returned by the model, service, or business logic.
  - The values of any relevant variables at the point of logging.

---

# End of User Controller Documentation 