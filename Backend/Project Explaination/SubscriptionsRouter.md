# Subscriptions Router Documentation (`subscriptionsRouter.ts`)

## Overview
Defines the Express router for all subscription-related API endpoints. Handles route registration, authentication middleware, controller integration, Stripe webhook handling, and public/private route separation.

---

## 1. Route Definitions
- `POST /stripe/webhooks`: Handles Stripe webhook events (raw body parsing).
- `GET /public/plans`: Public route to fetch visible subscription plans.
- `GET /get-all-plans`: Authenticated user fetches all plans (admin gets all, user gets visible).
- `GET /current-subscription`: Authenticated user fetches their current subscription.
- `POST /create-plans`: Authenticated user creates a new subscription plan.
- `POST /gift-subscription`: Authenticated admin gifts a subscription to a user.
- `POST /create-checkout-session`: Authenticated user creates a Stripe checkout session.
- `GET /get-invoices`: Authenticated user fetches their invoices.
- `POST /update-plans`: Authenticated user updates a subscription plan.
- `DELETE /delete-plan/:id`: Authenticated user deletes a subscription plan.
- `PATCH /:id/visibility`: Authenticated user toggles subscription visibility.
- `POST /advance-time/:subscriptionId`: Advances Stripe test clock (development only).

---

## 2. Middleware Usage
- Uses `authMiddleware` to protect all routes except public plans and Stripe webhooks.
- Uses `express.raw` for Stripe webhook route.

---

## 3. Controller Integration
- Each route delegates business logic to the corresponding controller function.

---

## Notes
- For any unclear middleware or controller logic, insert a log statement and instruct the user to provide:
  - The full object or value returned by the middleware or controller.
  - The values of any relevant variables at the point of logging.

---

# End of Subscriptions Router Documentation 