# Campaign Controller Documentation (`campaignController.ts`)

## Overview
Implements all business logic for campaign-related API endpoints. Handles campaign creation, retrieval, update, deletion, approval, rejection, run cycle/location updates, and campaign limit checks. Integrates with models, services, and notification/email/socket systems.

---

## 1. Upload URL Generation
- `generateUploadUrl`: Validates file type, generates a presigned S3 upload URL, and returns the final S3 URL for campaign media uploads.

---

## 2. Campaign Creation
- `createCampaign`: Validates input, checks user subscription and campaign limits, parses locations, and creates a new campaign. Sends notification on creation.

---

## 3. Campaign Retrieval
- `getCampaigns`: Fetches all campaigns for the authenticated user, populates related fields.
- `getCampaignsToReview`: Fetches campaigns for admin review, with optional status filtering.
- `getCampaignById`: Fetches a specific campaign for the authenticated user.
- `getCampaignDetails`: Fetches campaign details by ID (admin or driver view).

---

## 4. Campaign Update
- `updateCampaign`: Validates input, checks subscription and limits, updates campaign fields, resets approval status, and sends notification.

---

## 5. Campaign Deletion
- `deleteCampaign`: Deletes a campaign by ID, with different logic for admin and user roles.

---

## 6. Campaign Approval/Rejection
- `approveCampaign`: Approves a campaign, updates status, emits campaign to drivers if active, sends notifications.
- `rejectCampaign`: Rejects a campaign, updates status, sends notifications.

---

## 7. Run Cycle and Location Update
- `updateCampaignCycleAndLocation`: Updates played locations and run cycle count, checks subscription cycle limits, marks campaigns/subscription as completed if needed, sends notifications and emits events.

---

## 8. Campaign Limit Check
- `checkCampaignLimit`: Checks if the user can create more campaigns based on subscription limits.

---

## Error Handling
- All controller functions handle errors and return appropriate HTTP status codes and messages.

---

## Notes
- Integrates with Campaign, Notification, and Subscription models, as well as S3, email, and socket services.
- For any unclear model, service, or event logic, insert a log statement and instruct the user to provide:
  - The full object or value returned by the model, service, or event.
  - The values of any relevant variables at the point of logging.

---

# End of Campaign Controller Documentation 