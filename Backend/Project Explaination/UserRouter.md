# User Router Documentation (`userRouter.ts`)

## Overview
Defines the Express router for all user-related API endpoints. Handles route registration, authentication middleware, controller integration, and Google OAuth.

---

## 1. Route Definitions
- Auth routes: signup, login, verify-otp, resend-otp, verify-token, forgot-password, reset-password, change-password, logout.
- Google OAuth routes: /auth/google, /auth/google/callback.
- Profile routes: get profile, update profile, delete account.
- User management: get users list, ban/unban users, check admin status.

---

## 2. Middleware Usage
- Uses `authMiddleware` to protect profile and user management routes.
- Uses multer for profile image upload.
- Uses passport for Google OAuth callback.

---

## 3. Controller Integration
- Each route delegates business logic to the corresponding controller function.

---

## Notes
- For any unclear middleware or controller logic, insert a log statement and instruct the user to provide:
  - The full object or value returned by the middleware or controller.
  - The values of any relevant variables at the point of logging.

---

# End of User Router Documentation 