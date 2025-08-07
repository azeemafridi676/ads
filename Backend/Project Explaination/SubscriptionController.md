# Subscription Controller Documentation (`subscriptionController.ts`)

## Overview
Implements all business logic for subscription-related API endpoints. Handles subscription creation, retrieval, update, deletion, checkout sessions, invoice management, Stripe integration, gifting, test clock, and visibility toggling. Integrates with Subscription, Invoice, UsedSession, User, and Campaign models, and Stripe API.

---

## 1. Create Subscription
- `createSubscription`: Validates input, creates Stripe product/price, and saves subscription in the database.

---

## 2. Get All Subscriptions
- `getAllSubscriptions`: Retrieves all subscriptions (admin) or only visible ones (user), flags if in use.

---

## 3. Get Subscription Invoices
- `getSubscriptionInvoices`: Aggregates and returns invoices with user and subscription details.

---

## 4. Update Subscription
- `updateSubscription`: Validates input, checks if in use, updates Stripe product/price, and updates subscription in the database.

---

## 5. Delete Subscription
- `deleteSubscription`: Checks if in use, archives Stripe product, and deletes subscription from the database.

---

## 6. Checkout Session Detail
- `checkoutSessionDetail`: Validates session, checks payment status, marks session as used.

---

## 7. Create Checkout Session
- `createCheckoutSession`: Validates plan, creates Stripe customer/session, returns session for frontend checkout.

---

## 8. Toggle Subscription Visibility
- `toggleSubscriptionVisibility`: Toggles the visibility of a subscription plan.

---

## 9. Gift Subscription
- `giftSubscription`: Admin gifts a subscription to a user, updates user and campaign data, emits events.

---

## 10. Advance Test Clock
- `advanceTestClock`: Advances Stripe test clock for development/testing.

---

## 11. Get Current Subscription
- `getCurrentSubscription`: Retrieves the current subscription and status for the authenticated user.

---

## 12. Get Public Subscriptions
- `getPublicSubscriptions`: Retrieves paginated, visible subscription plans for public display.

---

## Error Handling
- All controller functions handle errors and return appropriate HTTP status codes and messages.

---

## Notes
- Integrates with Subscription, Invoice, UsedSession, User, Campaign models, and Stripe API.
- For any unclear model, Stripe, or business logic, insert a log statement and instruct the user to provide:
  - The full object or value returned by the model, Stripe, or business logic.
  - The values of any relevant variables at the point of logging.

---

# End of Subscription Controller Documentation 