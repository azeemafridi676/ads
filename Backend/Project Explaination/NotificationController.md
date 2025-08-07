# Notification Controller Documentation (`NotificationController.ts`)

## Overview
Implements all business logic for notification-related API endpoints. Handles retrieval of all and unread notifications, marking notifications as read, and marking all as read. Integrates with the Notification model.

---

## 1. Get All Notifications
- `getAllNotifications`: Retrieves up to 50 notifications for the authenticated user, sorted by creation date.

---

## 2. Get Unread Notifications
- `getUnreadNotifications`: Retrieves all unread notifications for the authenticated user, sorted by creation date.

---

## 3. Mark Notifications as Read
- `markNotificationsAsRead`: Marks specific notifications as read for the authenticated user.
  - Accepts an array of notification IDs in the request body.

---

## 4. Mark All Notifications as Read
- `markAllNotificationsAsRead`: Marks all unread notifications as read for the authenticated user.

---

## Error Handling
- All controller functions handle errors and return appropriate HTTP status codes and messages.

---

## Notes
- Integrates with the Notification model.
- For any unclear model or update logic, insert a log statement and instruct the user to provide:
  - The full object or value returned by the model or update operation.
  - The values of any relevant variables at the point of logging.

---

# End of Notification Controller Documentation 