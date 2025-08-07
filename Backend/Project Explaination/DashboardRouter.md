# Dashboard Router Documentation (`dashboardRouter.ts`)

## Overview
Defines the Express router for all dashboard-related API endpoints. Handles route registration, authentication middleware, and controller integration for user and admin dashboard data.

---

## 1. Route Definitions
- `GET /user`: Authenticated user fetches their dashboard data.
- `GET /admin`: Authenticated admin fetches admin dashboard data.

---

## 2. Middleware Usage
- Uses `authMiddleware` to protect all routes.

---

## 3. Controller Integration
- Each route delegates business logic to the corresponding controller function.

---

## Notes
- For any unclear middleware or controller logic, insert a log statement and instruct the user to provide:
  - The full object or value returned by the middleware or controller.
  - The values of any relevant variables at the point of logging.

---

# End of Dashboard Router Documentation 