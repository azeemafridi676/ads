# Lib Directory Documentation

## Overview
The `lib` directory contains utility and integration files for AWS, email, sockets, Stripe, token generation, and validation. These files provide reusable logic and third-party integration for the backend system.

---

## 1. `awsConfig.ts`
- **Purpose:** Configures AWS SDK and exports an S3 instance for file uploads.
- **Integration:** Used by file upload and media services.

---

## 2. `emailConfig.ts`
- **Purpose:** Configures and initializes Nodemailer SMTP transporter for sending emails.
- **Key Logic:**
  - Resolves SMTP host IP via DNS lookup.
  - Sets up transporter with authentication, TLS, and connection pooling.
  - Verifies connection on startup.
- **Integration:** Used by emailService for all outgoing emails.

---

## 3. `socketConfig.ts`
- **Purpose:** Sets up and manages Socket.IO server for real-time communication.
- **Key Logic:**
  - Initializes Socket.IO with CORS and authentication middleware.
  - Handles user connection, disconnection, and room management.
  - Provides functions to emit events to users, admins, and all clients.
- **Integration:** Used by controllers and services for real-time notifications and events.

---

## 4. `stripeConfig.ts`
- **Purpose:** Initializes and exports Stripe SDK instance for payment processing.
- **Integration:** Used by subscription and webhook controllers.

---

## 5. `tokenUtils.ts`
- **Purpose:** Provides utility for generating secure random tokens (e.g., password reset tokens).
- **Integration:** Used by userController for password reset flows.

---

## 6. `validation.ts`
- **Purpose:** Provides utility for validating required fields in request bodies.
- **Integration:** Used by controllers for input validation.

---

## Notes
- For any unclear utility or integration logic, insert a log statement and instruct the user to provide:
  - The full object or value returned by the utility or integration.
  - The values of any relevant variables at the point of execution.

---

# End of Lib Directory Documentation 