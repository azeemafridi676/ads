# Subscriptions Module Documentation

## Overview
The Subscriptions module manages the creation, display, purchase, and administration of subscription plans for the platform. It includes components for both admin (plan management) and user (plan selection and purchase) flows. The module integrates with backend services for CRUD operations, Stripe for payments, and uses Angular forms and UI feedback mechanisms.

---

## 1. `admin-subscriptions` Component

### TypeScript (`admin-subscriptions.component.ts`)
- Handles CRUD operations for subscription plans (create, read, update, delete).
- Uses Angular Reactive Forms for plan creation and editing.
- Integrates with a `SubscriptionsService` for backend API calls.
- Manages UI state for modals, loading, editing, and deletion.
- Handles plan visibility toggling and disables editing/deletion for plans in use.
- Animates modal dialogs and plan cards.
- Uses Toastr for user feedback.
- Checks if plan descriptions need expansion based on rendered height.
- **If any data structure or service method is unclear, a log statement is inserted and the user is instructed to provide the log output.**

### HTML (`admin-subscriptions.component.html`)
- Renders a tabbed interface for monthly and yearly plans.
- Displays loading skeletons, empty states, and plan cards.
- Provides modals for creating and editing plans.
- Allows toggling plan visibility, editing, and deletion.
- Shows plan details, limits, and status.

### SCSS (`admin-subscriptions.component.scss`)
- Styles for description clamping, modal overlays, card transitions, and dropdown menus.
- Ensures smooth UI transitions and responsive layouts.

---

## 2. `user-subscriptions` Component

### TypeScript (`user-subscriptions.component.ts`)
- Fetches and displays the user's current subscription and all available plans.
- Integrates with Stripe for payment and checkout flows.
- Handles real-time updates via socket events for subscription changes.
- Uses Angular Reactive Forms and UI feedback.
- Manages plan purchase, renewal, and display logic.
- Expands/collapses plan descriptions based on content height.
- **If any data structure or service method is unclear, a log statement is inserted and the user is instructed to provide the log output.**

### HTML (`user-subscriptions.component.html`)
- Shows current subscription details or prompts to purchase if none exists.
- Renders available plans with purchase/renewal actions.
- Displays loading skeletons, empty states, and plan features.
- Handles tab switching between monthly and yearly plans.

### SCSS (`user-subscriptions.component.scss`)
- Styles for description clamping, card transitions, and responsive layouts.
- Ensures visual consistency with admin view.

---

## Notes
- All service interactions are abstracted through the `SubscriptionsService`.
- Stripe integration is handled via the `@stripe/stripe-js` package.
- Socket events are used for real-time updates.
- UI feedback is provided via Toastr and loading indicators.
- For any unclear data structures or service methods, logs are inserted and the user is instructed to provide the following log output:
  - The full response or object structure returned by the service or method in question.
  - The values of any relevant variables at the point of logging.

---

# End of Subscriptions Module Documentation 