# Users List Component Documentation

## Overview
The Users List component provides an interface for administrators to view, search, paginate, and manage users. It supports actions such as banning/unbanning users, gifting subscriptions, and starting chats. The component uses Angular Reactive Forms, modals, and interacts with user, chat, and subscription services for backend communication.

---

## 1. `users-list.component.ts`

### Purpose
Handles the logic for displaying, searching, paginating, and managing users. Manages modal visibility, expanded state, and communicates with the backend via various services.

### Logic
- **State Management**:
  - `users`: Array holding the current list of users.
  - `loading`: Boolean indicating loading state for UI feedback.
  - `error`: Holds error messages for display.
  - `searchTerm`: Current search term for filtering users.
  - `currentPage`, `totalPages`, `totalItems`, `itemsPerPage`: Pagination state.
  - `expandedState`: Tracks expanded fields for each user (name, email, phone).
  - `activeDropdown`: Tracks which user's action dropdown is open.
  - `showBanModal`, `selectedUser`, `banReason`: State for banning users.
  - `showGiftSubscriptionModal`, `selectedSubscription`, `subscriptions`, `loadingSubscriptions`: State for gifting subscriptions.

- **Lifecycle**:
  - `ngOnInit()`: Fetches users, sets navigation titles, and subscribes to real-time user status updates.
  - `ngOnDestroy()`: Cleans up subscriptions.

- **Core Methods**:
  - `fetchUsers()`: Fetches users from the backend with pagination and search.
  - `onSearch(event)`: Handles search input and triggers user fetch with debounce.
  - `onPageChange(page)`: Handles pagination.
  - `getPageNumbers()`: Calculates visible page numbers for pagination.
  - `toggleDropdown(userId)`: Opens/closes the action dropdown for a user.
  - `isExpanded(userId, field)`, `toggleExpand(userId, field)`: Manages expanded state for user fields.
  - `isAnyFieldExpanded(userId)`: Checks if any field is expanded for a user.
  - `startChat(user)`: Initiates or retrieves a chat thread with a user.
  - `showBanConfirmation(user)`, `cancelBan()`, `confirmBan()`: Handles banning users.
  - `unbanUser(user)`: Handles unbanning users.
  - `openGiftSubscriptionModal(user)`, `closeGiftSubscriptionModal()`, `fetchSubscriptions()`, `selectSubscription(subscription)`, `giftSubscription()`: Handles gifting subscriptions to users.

- **Error Handling**:
  - Uses `ToastrService` to display error messages for failed operations.

---

## 2. `users-list.component.html`

### Purpose
Defines the UI for displaying, searching, paginating, and managing users, including modals for banning and gifting subscriptions.

### Logic
- **Loading State**: Shows a skeleton loader while users are being fetched.
- **Error State**: Displays error messages if user fetch fails.
- **Users Table**: Displays user details, contact info, role, status, and actions. Supports field expansion for long values.
- **Action Dropdown**: Provides actions for chat, gift subscription, ban/unban.
- **Ban Modal**: Confirmation dialog for banning users with optional reason.
- **Gift Subscription Modal**: Allows selection and gifting of subscription plans to users.
- **Pagination**: Controls for navigating between pages of users.
- **Responsive Layout**: Uses Tailwind CSS classes for layout and styling.

---

## 3. `users-list.component.scss`
- Contains component-specific styles for table, transitions, skeleton loader, and expanded rows. No business logic.

---

## 4. Spec File
- Contains unit tests for component creation. No business logic.

---

## 5. Service and Data Structure Uncertainty
If any service method or data structure is unclear, a log statement must be inserted in the relevant file. The user must run the code and provide the following log output:
- The full output of the log statement(s) inserted.
- The context in which the log was triggered (e.g., which action or user flow).

---

## End of Users List Component Documentation 