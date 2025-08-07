# Email Service Documentation (`emailService.ts`)

## Overview
Implements email sending logic for various user and campaign events. Handles template loading and caching, transporter initialization, and sending emails for OTP, password reset, chat, campaign, subscription, and welcome events. Integrates with Handlebars for templating and nodemailer for SMTP.

---

## 1. Template Loading and Caching
- `loadTemplate`: Loads and compiles Handlebars templates from the templates directory, caches them for reuse.
- `getCommonTemplateData`: Provides common data (logo, URLs) for all templates.

---

## 2. Transporter Initialization
- `ensureTransporter`: Initializes and caches the nodemailer transporter using emailConfig.
- `sendEmail`: Sends email using the transporter, handles errors.

---

## 3. Email Sending Functions
- `sendResetPasswordEmail`: Sends password reset email with token.
- `sendOtpEmail`: Sends OTP email for authentication.
- `sendNewChatMessageToAdmin`: Notifies admin of new user chat message.
- `sendNewChatMessageToUser`: Notifies user of new admin chat message.
- `sendCampaignStatusUpdate`: Notifies user of campaign status changes.
- `sendCampaignCycleComplete`: Notifies user of campaign cycle completion.
- `sendWelcomeEmail`: Sends welcome email to new users.
- `sendCampaignCycleRunning`: Notifies user when campaign cycle starts.
- `sendSubscriptionCompletionEmail`: Notifies user when subscription cycles are completed.

---

## Error Handling
- All email sending functions handle errors and log them.

---

## Notes
- Integrates with Handlebars for templating and nodemailer for SMTP.
- For any unclear template, transporter, or email logic, insert a log statement and instruct the user to provide:
  - The full object or value returned by the template, transporter, or email send operation.
  - The values of any relevant variables at the point of logging.

---

# End of Email Service Documentation 