# Chat Service Documentation (`ChatService.ts`)

## Overview
Implements business logic for chat threads and messages. Handles thread creation, message sending, retrieval, marking as read, and thread lookup. Integrates with models and emits socket events for real-time updates.

---

## 1. Thread Management
- `createThread`: Creates a new chat thread for a user, emits thread status update to admin.
- `createOrGetThread`: Finds an existing thread for a user or creates a new one, populates user and last message.
- `getAdminThreads`: Fetches paginated threads for admin, supports search by user fields.

---

## 2. Message Management
- `getThreadMessages`: Fetches paginated messages for a thread, marks as read, returns messages in chronological order.
- `sendMessage`: Saves a message to the database, updates thread's last message and activity.
- `markMessagesAsRead`: Marks all messages in a thread as read, emits socket event, updates thread unread count.

---

## Notes
- Integrates with Thread, Message, and User models, and emits socket events for real-time updates.
- For any unclear model, service, or event logic, insert a log statement and instruct the user to provide:
  - The full object or value returned by the model, service, or event.
  - The values of any relevant variables at the point of logging.

---

# End of Chat Service Documentation 