# Config Directory Documentation

## Overview
The `config` directory contains configuration files for authentication and third-party integrations. These files set up strategies, validate environment variables, and provide integration points for the backend system.

---

## 1. `passport.ts`
- **Purpose:** Configures Google OAuth 2.0 authentication using Passport.js.
- **Key Logic:**
  - Validates required environment variables (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FRONTEND_URL`).
  - Sets up GoogleStrategy with appropriate callback URL for development/production.
  - Handles user lookup/creation on Google login/signup.
  - Returns user object or a special object for new users.
- **Integration:** Used by user authentication routes for Google OAuth.

---

## Notes
- For any unclear configuration or strategy logic, insert a log statement and instruct the user to provide:
  - The full object or value returned by the config or strategy.
  - The values of any relevant variables at the point of configuration.

---

# End of Config Directory Documentation 