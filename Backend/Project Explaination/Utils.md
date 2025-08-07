# Utils Directory Documentation

## Overview
The `utils` directory contains utility files for error handling and other helper logic. These files provide reusable logic for backend error management and other cross-cutting concerns.

---

## 1. `errors.ts`
- **Purpose:** Defines custom error classes for application-specific error handling.
- **Key Logic:**
  - `NotFoundError`: Custom error class for not found errors.
- **Integration:** Used by services and controllers to throw and handle not found errors.

---

## Notes
- For any unclear utility or error logic, insert a log statement and instruct the user to provide:
  - The full object or value returned by the utility or error class.
  - The values of any relevant variables at the point of usage.

---

# End of Utils Directory Documentation 