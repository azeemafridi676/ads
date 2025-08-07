# Chat Router Documentation (`chatRouter.ts`)

## Overview
Defines the Express router for all chat-related API endpoints. Handles route registration, authentication middleware, and controller integration for chat threads and messages.

---

## 1. Route Definitions
- `GET /admin/threads`: Admin fetches all chat threads.
- `GET /get-messages`: User fetches their messages.
- `GET /get-admin-messages`: Admin fetches messages for a thread.
- `POST /send-message-to-admin`: User sends message to admin.
- `POST /send-message-to-user`: Admin sends message to user.
- `POST /mark-messages-read`: Marks messages as read in a thread.
- `POST /admin/create-thread`: Admin creates or retrieves a chat thread for a user.
- `GET /admin/thread/:threadId`: Admin fetches a specific thread by ID.

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

# End of Chat Router Documentation 