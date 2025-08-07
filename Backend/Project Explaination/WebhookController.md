# Webhook Controller Documentation (`webhookController.ts`)

## Overview
Implements Stripe webhook event handling for subscription and invoice events. Processes checkout sessions, subscription updates/cancellations, invoice payments, and updates user, subscription, and campaign data accordingly. Emits real-time events to users and admins.

---

## 1. Webhook Event Handler
- `handleWebhook`: Main entry point for Stripe webhook events.
  - Verifies signature and secret.
  - Parses event and dispatches to appropriate handler based on event type.
  - Handles:
    - `checkout.session.completed`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
    - `invoice.payment_succeeded`
    - `invoice.payment_failed`

---

## 2. Checkout Session Completed
- `handleCheckoutSessionCompleted`: Processes completed checkout sessions.
  - Updates user with Stripe customer ID, subscription, and status.
  - Emits subscription purchased event to user and admin.

---

## 3. Subscription Updated
- `handleSubscriptionUpdated`: Processes subscription updates.
  - Updates user subscription dates and status.
  - Emits subscription updated event to user.

---

## 4. Subscription Deleted
- `handleSubscriptionDeleted`: Processes subscription cancellations.
  - Updates user subscription status and clears subscription reference.
  - Emits subscription cancelled event to user.

---

## 5. Invoice Payment Succeeded
- `handleInvoicePaymentSucceeded`: Processes successful invoice payments.
  - Updates user and subscription status/dates.
  - Creates invoice record.
  - Resets campaign status and cycles.
  - Emits subscription updated event to user.

---

## 6. Invoice Payment Failed
- `handleInvoicePaymentFailed`: Processes failed invoice payments.
  - Updates user and subscription status.
  - Creates failed invoice record.

---

## Error Handling
- All handler functions handle errors and log them.
- Webhook handler returns appropriate HTTP status codes and error messages.

---

## Notes
- Integrates with Stripe API, User, Subscription, Invoice, and Campaign models.
- Emits events via socket for real-time updates.
- For any unclear event, model, or Stripe logic, insert a log statement and instruct the user to provide:
  - The full object or value returned by the event, model, or Stripe API.
  - The values of any relevant variables at the point of logging.

---

# End of Webhook Controller Documentation 