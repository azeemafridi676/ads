# Driver Router Documentation (`driverRouter.ts`)

## Overview
Defines the Express router for all driver-related API endpoints. Handles route registration, authentication middleware, and controller integration for campaign retrieval and download status updates.

---

## 1. Route Definitions
- `GET /get-compaigns-for-screen`: Authenticated driver fetches campaigns for external screen display.
- `GET /get-compaigns-for-electron`: Authenticated driver fetches campaigns for the Electron app.
- `POST /update-campaign-download`: Authenticated driver updates campaign download status.

---

## 2. Middleware Usage
- Uses `authMiddleware` to protect all routes.

---

## 3. Controller Integration
- Each route delegates business logic to the corresponding controller function.

---

## Notes
- For any unclear middleware or controller logic, insert a log statement and instruct the user to provide:
  - The full object or value returned by the middleware or controller.
  - The values of any relevant variables at the point of logging.

---

# End of Driver Router Documentation 