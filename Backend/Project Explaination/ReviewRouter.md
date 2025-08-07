# Review Router Documentation (`reviewRouter.ts`)

## Overview
Defines the Express router for all review-related API endpoints. Handles route registration, authentication middleware, and controller integration for review CRUD and approval.

---

## 1. Route Definitions
- `GET /approved`: Public route to fetch approved reviews.
- `POST /`: Authenticated user creates a review.
- `GET /my-reviews`: Authenticated user fetches their reviews.
- `GET /all`: Admin fetches all reviews.
- `GET /:id`: Authenticated user fetches a review by ID.
- `PUT /:id`: Authenticated user updates a review by ID.
- `PATCH /:id/status`: Admin updates review status.
- `DELETE /:id`: Authenticated user or admin deletes a review by ID.

---

## 2. Middleware Usage
- Uses `authMiddleware` to protect all routes except `GET /approved`.

---

## 3. Controller Integration
- Each route delegates business logic to the corresponding controller function.

---

## Notes
- For any unclear middleware or controller logic, insert a log statement and instruct the user to provide:
  - The full object or value returned by the middleware or controller.
  - The values of any relevant variables at the point of logging.

---

# End of Review Router Documentation 