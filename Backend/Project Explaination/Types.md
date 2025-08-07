# Types Directory Documentation

## Overview
The `types` directory contains TypeScript type definitions and interfaces for API responses and Express request extensions. These files provide type safety and structure for backend code.

---

## 1. `apiResponse.ts`
- **Purpose:** Defines the `ApiResponse<T>` interface for standardizing API responses.
- **Structure:**
  - `data`: Optional, holds response data.
  - `message`: Optional, holds status or error message.
  - `status`: Required, HTTP status code.
- **Integration:** Used by controllers for consistent API responses.

---

## 2. `express.d.ts`
- **Purpose:** Extends Express `Request` interface to include a `user` property.
- **Structure:**
  - Adds `user?: User` to `Express.Request`.
- **Integration:** Used by middleware and controllers to access authenticated user.

---

## Notes
- For any unclear type or interface logic, insert a log statement and instruct the user to provide:
  - The full object or value returned by the type or interface.
  - The values of any relevant variables at the point of usage.

---

# End of Types Directory Documentation 