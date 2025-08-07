# Driver Controller Documentation (`DriverController.ts`)

## Overview
Implements all business logic for driver-related API endpoints. Handles campaign retrieval for screens and drivers, campaign filtering by time, date, and subscription, and campaign download status updates. Integrates with the Campaign model and uses moment-timezone for date logic.

---

## 1. Campaign Retrieval for Screen
- `getCompainsForScreen`: Retrieves campaigns for display on external screens.
  - Filters campaigns by approval status, status, and completion.
  - Populates selected locations and user subscription.
  - Filters by active subscription and run cycle limits.
  - Filters by campaign date range (using timezone).
  - Returns valid campaigns or 204 if none found.

---

## 2. Campaign Download Status Update
- `updateCampaignDownloadStatus`: Updates the download status and assigned driver for a campaign.
  - Validates campaign ID and request body.
  - Updates campaign fields (assignToDriverId, downloadedUrl, isDownloaded).
  - Returns updated campaign or 404 if not found.

---

## 3. Campaign Retrieval for Driver (Electron)
- `getCompainsForDriver`: Retrieves campaigns for the driver app (Electron).
  - Filters campaigns by completion status.
  - Populates user subscription.
  - Filters by approval, status, date range, and time window.
  - Returns valid campaigns or 404 if none found.

---

## Error Handling
- All controller functions handle errors and return appropriate HTTP status codes and messages.

---

## Notes
- Integrates with the Campaign model and uses moment-timezone for all date logic.
- For any unclear model, date, or filter logic, insert a log statement and instruct the user to provide:
  - The full object or value returned by the model, date, or filter.
  - The values of any relevant variables at the point of logging.

---

# End of Driver Controller Documentation 