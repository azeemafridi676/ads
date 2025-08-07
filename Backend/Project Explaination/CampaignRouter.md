# Campaign Router Documentation (`campaignRouter.ts`)

## Overview
Defines the Express router for all campaign-related API endpoints. Handles route registration, authentication middleware, file upload handling, and controller integration for campaign CRUD and workflow operations.

---

## 1. Route Definitions
- `POST /generate-upload-url`: Generates a presigned S3 upload URL for campaign media. Requires authentication.
- `POST /create-campaign`: Creates a new campaign. Requires authentication and handles file upload via multer.
- `GET /get-campaigns`: Retrieves all campaigns for the authenticated user.
- `GET /get-campaigns-to-review`: Retrieves campaigns for admin review.
- `GET /get-campaign-by-id/:id`: Retrieves a specific campaign by ID for the authenticated user.
- `PUT /update-campaign/:id`: Updates a campaign. Requires authentication and handles file upload via multer.
- `DELETE /delete-campaign/:id`: Deletes a campaign by ID.
- `GET /get-campaign-details/:id`: Retrieves campaign details by ID.
- `PUT /approve-campaign/:id`: Approves a campaign (admin action).
- `PUT /reject-campaign/:id`: Rejects a campaign (admin action).
- `PUT /update-campaign-cycle-location/:id`: Updates campaign run cycle and played location (driver action).
- `GET /check-campaign-limit`: Checks if the user can create more campaigns.

---

## 2. Middleware Usage
- Uses `authMiddleware` to protect all routes except `update-campaign-cycle-location`.
- Uses multer for file upload handling on create and update routes.

---

## 3. Controller Integration
- Each route delegates business logic to the corresponding controller function.

---

## Notes
- For any unclear middleware or controller logic, insert a log statement and instruct the user to provide:
  - The full object or value returned by the middleware or controller.
  - The values of any relevant variables at the point of logging.

---

# End of Campaign Router Documentation 