# Chat Module Documentation

## Overview
The Chat module provides real-time messaging functionality for both administrators and users. It includes components for admin chat (handling multiple user threads) and user chat (support for end-users to contact support). The module integrates with chat, socket, authentication, and navigation services.

---

## 1. `admin-chat` Component

### Purpose
Enables administrators to manage and respond to user support conversations. Supports multiple threads, real-time updates, message status tracking, and user presence.

### Logic
- **State Management**:
  - `threads`: List of chat threads (conversations with users).
  - `selectedThread`: Currently selected thread for viewing/responding.
  - `messages`: List of messages in the selected thread.
  - `newMessage`: Current message input.
  - `loading`, `hasMore`, `searchTerm`, `page`, `limit`: UI and pagination state.
  - `subscriptions`: Holds all active RxJS subscriptions for cleanup.
  - `threadLoadSubject`, `searchDebounce`: Subjects for debounced loading and searching.
  - `shouldScroll`: Flag to trigger scroll after view update.
- **Lifecycle**:
  - `ngOnInit()`: Sets up socket listeners, loads threads, handles query params for direct thread access, sets navigation titles.
  - `ngAfterViewChecked()`: Scrolls to bottom if needed after view updates.
  - `ngOnDestroy()`: Cleans up subscriptions and resets chat state.
- **Core Methods**:
  - `loadThreads()`, `reloadThread()`, `loadMessages()`: Fetch and display threads/messages.
  - `sendMessage()`: Sends a message as admin, handles optimistic UI update and error handling.
  - `onSearchInput()`, `handleSearch()`: Debounced search for threads.
  - `onMessageInput()`: Handles input resizing and character limit.
  - `updateThreadLastMessage()`, `sortThreads()`: Updates thread metadata and ordering.
  - Socket listeners for new messages, status updates, user presence, and message status.
- **Error Handling**:
  - Uses `LoggingService` for error logging.
- **UI**:
  - Sidebar for threads, main chat area, message bubbles, status indicators, search, and loading/empty states.
  - Responsive design for mobile/desktop.
  - Animations for message entry and typing indicators.

---

## 2. `user-chat` Component

### Purpose
Allows end-users to communicate with support/admins in real time. Supports message sending, status tracking, and admin presence indication.

### Logic
- **State Management**:
  - `messages`: List of chat messages.
  - `newMessage`: Current message input.
  - `loading`, `isTyping`, `isAdminOnline`: UI and presence state.
  - `userDetail`: Current user info.
  - `subscriptions`: Holds all active RxJS subscriptions for cleanup.
  - `shouldScroll`: Flag to trigger scroll after view update.
- **Lifecycle**:
  - `ngOnInit()`: Sets up socket listeners, initializes chat, sets navigation titles.
  - `ngAfterViewChecked()`: Scrolls to bottom if needed after view updates.
  - `ngOnDestroy()`: Cleans up subscriptions and resets chat state.
- **Core Methods**:
  - `initializeChat()`, `loadMessages()`: Fetch and display messages.
  - `sendMessage()`: Sends a message as user, handles optimistic UI update and error handling.
  - `onMessageInput()`: Handles input resizing and character limit.
  - Socket listeners for new messages, status updates, and admin presence.
- **Error Handling**:
  - Uses `LoggingService` for error logging.
- **UI**:
  - Chat header with admin status, message bubbles, typing indicator, and input area.
  - Responsive design and animations for message entry.

---

## 3. SCSS and Spec Files
- SCSS files provide styling and animation for each component. No business logic.
- Spec files are for unit testing component creation. No business logic.

---

## 4. Service and Data Structure Uncertainty
If any service method or data structure is unclear, a log statement must be inserted in the relevant file. The user must run the code and provide the following log output:
- The full output of the log statement(s) inserted.
- The context in which the log was triggered (e.g., which action or user flow).

---

## End of Chat Module Documentation 