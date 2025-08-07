# Environment Variables Documentation (`.env`)

## Overview
The `.env` file defines environment variables for backend configuration, including database, authentication, email, AWS, Stripe, and application settings. These variables are loaded at runtime and control critical aspects of the system.

---

## 1. Database
- `MONGO_URI`: MongoDB connection string for the application's database.

---

## 2. Server
- `PORT`: Port on which the backend server runs.
- `STATUS`: Application status (e.g., dev, prod).
- `NODE_ENV`: Node.js environment (development, production, etc.).

---

## 3. Website Info
- `LOGO_URL`: URL for the logo used in emails and templates.
- `FACEBOOK_URL`, `TWITTER_URL`, `LINKEDIN_URL`, `INSTAGRAM_URL`: Social media links for branding and email templates.

---

## 4. JWT Authentication
- `JWT_SECRET`: Secret key for signing JWT tokens.
- `JWT_EXPIRY`: Expiry duration for access tokens.
- `JWT_REFRESH_EXPIRY`: Expiry duration for refresh tokens.

---

## 5. Geoapify
- `GEOAPIFY_API_KEY`: API key for Geoapify geocoding services.
- `GEOAPIFY_BASE_URL`: Base URL for Geoapify API.

---

## 6. Application URLs
- `FRONTEND_URL`: Base URL for the frontend application (used in emails, redirects, CORS, etc.).

---

## 7. SMTP Email
- `SMTP_HOST`: SMTP server host for sending emails.
- `SMTP_USERNAME`: SMTP username.
- `SMTP_PASSWORD`: SMTP password.
- `SMTP_EMAIL`: Default sender email address.
- `SMTP_PORT`: SMTP server port.
- `EMAIL_FROM`: Email address used in the 'from' field.

---

## 8. AWS S3
- `AWS_ACCESS_KEY_ID`: AWS access key for S3 uploads.
- `AWS_SECRET_ACCESS_KEY`: AWS secret key for S3 uploads.
- `AWS_REGION`: AWS region for S3 bucket.
- `AWS_S3_BUCKET`: S3 bucket name for file storage.

---

## 9. Stripe
- `STRIPE_SECRET_KEY`: Stripe secret key for payment processing.
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret for event verification.

---

## 10. Google OAuth
- `GOOGLE_CLIENT_ID`: Google OAuth client ID for authentication.
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret.

---

## 11. Timezone
- `TZ`: Timezone for date/time operations (e.g., America/Chicago).

---

## Notes
- All variables are loaded via dotenv and used throughout the backend for configuration.
- For any unclear variable or usage, insert a log statement in the relevant file and instruct the user to provide:
  - The value of the environment variable at runtime.
  - The effect of changing the variable on application behavior.

---

# End of Environment Variables Documentation 