# Email Templates Documentation

## Overview
This document explains the logic, structure, and dynamic fields of all HTML email templates used for transactional and notification emails. Each template is rendered with Handlebars and supports dynamic data injection for personalized communication.

---

## 1. `admin-new-chat.html`
- **Purpose:** Notifies admin of a new chat message from a user.
- **Key Dynamic Fields:**
  - `userName`: Name of the user who sent the message.
  - `messagePreview`: Preview of the message content.
  - `messageTime`: Timestamp of the message.
  - `chatUrl`: Link to the admin chat dashboard.
- **Used For:** Admin chat notifications.

---

## 2. `campaign-completed.html`
- **Purpose:** Notifies user that their campaign display cycle is complete.
- **Key Dynamic Fields:**
  - `userName`: Name of the user.
  - `campaignName`: Name of the campaign.
  - `displayTime`: Time when the campaign was displayed.
  - `location`: Location where the campaign was displayed.
  - `truckId`: Identifier for the truck.
  - `completionTime`: When the campaign cycle was completed.
  - `analyticsUrl`: Link to campaign analytics.
  - `campaignUrl`: Link to manage campaigns.
- **Used For:** Campaign cycle completion notifications.

---

## 3. `campaign-cycle-running.html`
- **Purpose:** Notifies user when a campaign cycle starts (campaign goes live).
- **Key Dynamic Fields:**
  - `userName`: Name of the user.
  - `campaignName`: Name of the campaign.
  - `startTime`: Start time of the campaign.
  - `analyticsUrl`: Link to campaign analytics.
- **Used For:** Campaign start notifications.

---

## 4. `campaign-status.html`
- **Purpose:** Notifies user of a campaign status change (approved, rejected, etc.).
- **Key Dynamic Fields:**
  - `userName`: Name of the user.
  - `campaignName`: Name of the campaign.
  - `status`: New status of the campaign.
  - `reason`: Reason for status change (if rejected).
  - `updateTime`: When the status was updated.
  - `dashboardUrl`: Link to campaign dashboard.
  - `supportUrl`: Link to support page.
- **Used For:** Campaign approval/rejection/status notifications.

---

## 5. `otp.html`
- **Purpose:** Sends a one-time password (OTP) for user authentication or verification.
- **Key Dynamic Fields:**
  - `userName`: Name of the user.
  - `otp`: The OTP code.
- **Used For:** Signup, login, or sensitive action verification.

---

## 6. `reset-password.html`
- **Purpose:** Sends a password reset link to the user.
- **Key Dynamic Fields:**
  - `resetUrl`: URL for resetting the password.
- **Used For:** Password reset requests.

---

## 7. `subscription-completion.html`
- **Purpose:** Notifies user that their subscription has completed all display cycles.
- **Key Dynamic Fields:**
  - `userName`: Name of the user.
  - `subscriptionName`: Name of the subscription plan.
  - `completedAt`: Date/time of completion.
  - `subscriptionUrl`: Link to subscription management.
- **Used For:** Subscription completion notifications.

---

## 8. `user-new-chat.html`
- **Purpose:** Notifies user of a new chat message from support/admin.
- **Key Dynamic Fields:**
  - `userName`: Name of the user.
  - `messagePreview`: Preview of the message content.
  - `messageTime`: Timestamp of the message.
  - `chatUrl`: Link to the user chat dashboard.
- **Used For:** User chat notifications.

---

## 9. `welcome.html`
- **Purpose:** Sends a welcome email to new users after signup.
- **Key Dynamic Fields:**
  - `userName`: Name of the user.
  - `loginUrl`: Link to login page.
  - `dashboardUrl`: Link to user dashboard.
  - `supportUrl`: Link to support page.
- **Used For:** User onboarding.

---

## Notes
- All templates use Handlebars syntax for dynamic fields.
- For any unclear template variable or usage, insert a log statement in the email service and instruct the user to provide:
  - The full data object passed to the template.
  - The values of any relevant variables at the point of rendering.

---

# End of Email Templates Documentation 