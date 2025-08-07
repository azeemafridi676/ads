# Chat Controller Documentation (`ChatController.ts`)

## Overview
Implements all business logic for chat-related API endpoints. Handles thread and message retrieval, sending messages, marking messages as read, thread creation, and admin/user chat flows. Integrates with models, services, socket, and email systems.

---

## 1. Thread Retrieval
- `getAdminThreads`: Fetches paginated threads for admin, supports search.
- `getThreadById`: Fetches a specific thread by ID for admin, populates user and last message.

---

## 2. Message Retrieval
- `getMessages`: Fetches all messages for the authenticated user, marks as read.
- `getAdminMessages`: Fetches paginated messages for a thread (admin view), marks as read.

---

## 3. Sending Messages
- `sendMessageToAdmin`: User sends message to admin. Finds or creates thread, emits socket event, updates unread count, saves message.
- `sendMessageToUser`: Admin sends message to user. Emits socket event, saves message, sends email if user is offline.

---

## 4. Marking Messages as Read
- `markMessagesAsRead`: Marks all messages in a thread as read for admin/user, emits socket event.

---

## 5. Thread Creation
- `createOrGetChatThread`: Admin creates or retrieves a chat thread for a user.
- `findOrCreateThread`: Helper to find or create a thread for a user.

---

## Error Handling
- All controller functions handle errors and return appropriate HTTP status codes and messages.

---

## Notes
- Integrates with Thread, Message, and User models, as well as ChatService, socket, and email services.
- For any unclear model, service, or event logic, insert a log statement and instruct the user to provide:
  - The full object or value returned by the model, service, or event.
  - The values of any relevant variables at the point of logging.

---

# End of Chat Controller Documentation 