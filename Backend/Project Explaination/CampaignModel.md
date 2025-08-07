# Campaign Model Documentation (`campaignModel.ts`)

## Overview
Defines the Mongoose schema and model for advertising campaigns. Handles campaign data structure, validation, approval/rejection logic, and time-based status management. Integrates with plugins and provides custom methods and virtuals for business logic.

---

## 1. Schema Definition
- Fields: campaignName, startDateTime, endDateTime, selectedLocations, mediaType, mediaUrl, mediaDuration, status, approvalStatus, userId, runCycleCount, hasCompletedCycles, assignToDriverId, downloadedUrl, isDownloaded, playedLocations.
- Field validation: required fields, type checks, enum constraints, custom validation for mediaDuration.
- Uses environment variable `TZ` for timezone handling; throws error if not set.

---

## 2. Plugins
- Integrates a custom timestamp plugin to add createdAt and updatedAt fields.

---

## 3. Indexes
- Indexes on userId+status, startDateTime+endDateTime, and approvalStatus.isApproved+status for query performance.

---

## 4. Methods
- `approve(adminId)`: Approves a campaign, sets approval fields, and updates status based on current time and campaign window.
- `reject(adminId, reason)`: Rejects a campaign, sets approval fields, and updates status.
- `isActive()`: Returns true if campaign is active, approved, and within its time window.

---

## 5. Virtuals
- `durationInDays`: Calculates campaign duration in days using moment and timezone.
- `remainingTime`: Calculates remaining time until campaign end, or 0 if not approved or expired.

---

## Notes
- All date/time logic uses moment-timezone and the configured timezone.
- For any unclear plugin, method, or virtual logic, insert a log statement and instruct the user to provide:
  - The full object or value returned by the plugin, method, or virtual.
  - The values of any relevant variables at the point of logging.

---

# End of Campaign Model Documentation 