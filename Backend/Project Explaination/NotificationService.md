# Notification Service Documentation (`NotificationService.ts`)

## Overview
Implements notification logic for campaigns and user events. Handles notification creation, campaign status updates, user notification retrieval, marking notifications as read, and integration with socket and email services.

---

## 1. Campaign Notification Creation
- `createCampaignNotification`: Emits admin notification for new campaign creation.

---

## 2. Campaign Status Notification
- `notifyCampaignStatus`: Notifies user of campaign status changes via email and socket.
  - Validates user data.
  - Sends email notification using emailService.
  - Creates notification in database.
  - Emits socket notification to user.

---

## 3. User Notification Retrieval
- `getUserNotifications`: Retrieves paginated notifications for a user.

---

## 4. Mark Notifications as Read
- `markAsRead`: Marks specified notifications as read in the database.

---

## Error Handling
- All functions handle errors and log them.

---

## Notes
- Integrates with Notification model, socket, and email services.
- For any unclear model, socket, or email logic, insert a log statement and instruct the user to provide:
  - The full object or value returned by the model, socket, or email operation.
  - The values of any relevant variables at the point of logging.

---

# End of Notification Service Documentation 