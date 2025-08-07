# Middleware Directory Documentation

## Overview
The `middleware` directory contains middleware functions for authentication and request processing. These files are used to protect routes and handle request validation.

---

## 1. `authMiddleware.ts`
- **Purpose:** Authenticates requests using JWT tokens.
- **Key Logic:**
  - Extracts and verifies JWT from the Authorization header.
  - Loads user from the database and attaches to the request object.
  - Handles missing/invalid tokens and user not found.
- **Integration:** Used by all protected routes to ensure only authenticated users can access them.

---

## Notes
- For any unclear middleware or authentication logic, insert a log statement and instruct the user to provide:
  - The full object or value returned by the middleware.
  - The values of any relevant variables at the point of execution.

---

# End of Middleware Directory Documentation 