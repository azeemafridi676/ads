# Notification Router Documentation (`notificationRoutes.ts`)

## Overview
Defines the Express router for all notification-related API endpoints. Handles route registration, authentication middleware, and controller integration for notification retrieval and update.

---

## 1. Route Definitions
- `GET /all`: Authenticated user fetches all notifications.
- `GET /unread`: Authenticated user fetches unread notifications.
- `POST /mark-read`: Authenticated user marks specific notifications as read.
- `POST /mark-all-read`: Authenticated user marks all notifications as read.

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

# End of Notification Router Documentation 