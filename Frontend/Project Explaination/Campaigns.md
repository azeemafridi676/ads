# Campaigns Module Documentation

## Overview
The Campaigns module manages the creation, review, approval, rejection, and display of advertising campaigns. It includes components for both admin and customer views, campaign creation, campaign details, and campaign listing. The module integrates with services for campaign data, location management, authentication, notifications, navigation, and real-time updates via sockets.

---

## 1. `admin-campaign-details` Component

### Purpose
Displays detailed information about a specific campaign for admin review, including status, media, customer info, locations, and a live map. Allows admins to approve or reject campaigns and see real-time updates.

### Logic
- **State Management**:
  - `campaign`: Holds the campaign data.
  - `loading`: Indicates loading state.
  - `showRejectionModal`, `selectedCampaign`, `rejectionReason`: Manage rejection modal state.
  - `approvingCampaign`, `rejectingCampaign`: Indicate approval/rejection in progress.
  - `locationUpdateCount`, `recentlyUpdatedLocations`: Track real-time location updates for animation.
- **Lifecycle**:
  - `ngOnInit()`: Loads campaign details, sets navigation, and subscribes to socket events for real-time updates.
  - `ngOnDestroy()`: Unsubscribes from all socket subscriptions.
- **Core Methods**:
  - `getCampaignDetails()`: Fetches campaign details from backend.
  - `approveCampaign()`, `rejectCampaign()`: Approve or reject the campaign via service.
  - `openRejectionModal()`, `closeRejectionModal()`: Manage rejection modal state.
  - `updateMapBounds()`: Adjusts Google Map bounds to fit all locations.
  - `getPosition()`, `formatPlayedAt()`, `getPlayedLocationMarkerOptions()`: Helpers for map markers and tooltips.
- **Error Handling**:
  - Uses `ToastrService` for user feedback.
  - Uses `LoggingService` for error logging.
- **UI**:
  - Status badges, media preview, info grids, map, floating notifications, and modals for rejection.
  - Animations for transitions and marker updates.

---

## 2. `campaign-detail` Component

### Purpose
Displays campaign details for a user, including status, media, statistics, locations, and a live map. Shows real-time updates for played locations and campaign cycles.

### Logic
- **State Management**:
  - `campaign`: Holds the campaign data.
  - `loading`: Indicates loading state.
  - `locationUpdateCount`, `recentlyUpdatedLocations`: Track real-time location updates for animation.
- **Lifecycle**:
  - `ngOnInit()`: Loads campaign details, sets navigation, and subscribes to socket events for real-time updates.
  - `ngOnDestroy()`: Unsubscribes from all socket subscriptions.
- **Core Methods**:
  - `loadCampaignDetails()`: Fetches campaign details from backend.
  - `updateMapBounds()`: Adjusts Google Map bounds to fit all locations.
  - `getPosition()`, `formatPlayedAt()`, `getPlayedLocationMarkerOptions()`: Helpers for map markers and tooltips.
- **Error Handling**:
  - Uses `ToastrService` for user feedback.
  - Uses `LoggingService` for error logging.
- **UI**:
  - Status badges, media preview, info grids, statistics, map, and floating notifications.
  - Animations for transitions and marker updates.

---

## 3. `campaigns-list` Component

### Purpose
Displays a list of campaigns for the user, with options to create, edit, delete, and view details. Shows campaign status, cycles, and locations. Integrates with real-time updates for campaign cycles and subscription events.

### Logic
- **State Management**:
  - `campaigns`: Array of campaign objects.
  - `loading`: Indicates loading state.
  - `showDeleteModal`, `selectedCampaign`, `deletingCampaignId`: Manage delete modal state.
  - `searchTerm`, `filterStatus`: For filtering campaigns.
- **Lifecycle**:
  - `ngOnInit()`: Loads campaigns, sets navigation, and subscribes to socket events for real-time updates.
  - `ngOnDestroy()`: Unsubscribes from all socket subscriptions.
- **Core Methods**:
  - `getCampaigns()`: Fetches campaigns from backend.
  - `openDeleteModal()`, `closeDeleteModal()`, `deleteCampaign()`: Manage campaign deletion.
  - `getStatusClass()`: Returns CSS classes for campaign status.
  - `filterCampaigns()`: Filters campaigns by search and status.
  - `handleCreateCampaign()`: Navigates to campaign creation.
- **Error Handling**:
  - Uses `ToastrService` for user feedback.
  - Uses `LoggingService` for error logging.
- **UI**:
  - Campaign cards, status badges, media previews, action buttons, and modals for deletion.
  - Animations for transitions and status changes.

---

## 4. `create-campaign` Component

### Purpose
Guides the user through a multi-step process to create or edit a campaign, including campaign details, location selection, and media upload. Enforces subscription limits and validates input.

### Logic
- **State Management**:
  - `currentStep`: Tracks the current step in the creation process.
  - `campaignForm`: Reactive form for campaign details.
  - `currentSubscription`, `locations`, `selectedLocations`: Data for campaign creation.
  - `mediaPreview`, `mediaType`, `mediaDuration`, `imageDuration`: Media upload state.
  - `isUploading`, `uploadProgress`, `uploadError`, `finalS3Url`: File upload state.
  - `isEditMode`, `campaignId`, `originalMediaUrl`, `currentCampaigns`: Edit mode and campaign tracking.
  - `showTimeModal`, `timeModalType`, `selectedHour`, `selectedMinute`, `selectedPeriod`: Time picker modal state.
- **Lifecycle**:
  - `ngOnInit()`: Checks subscription, fetches locations, initializes form, and checks for edit mode.
- **Core Methods**:
  - `initializeForm()`, `checkEditMode()`, `loadCampaignData()`: Form and edit mode setup.
  - `isLocationSelected()`, `toggleLocationSelection()`: Location selection logic.
  - `handleMediaUpload()`, `getVideoDuration()`, `createMediaPreview()`, `resetMedia()`: Media upload and preview logic.
  - `onDurationChange()`, `isVideoDurationValid()`: Media duration validation.
  - `nextStep()`, `previousStep()`: Step navigation.
  - `onSubmit()`: Submits campaign creation or update.
  - `getDateValue()`, `getTimeValue()`, `onDateChange()`, `onTimeChange()`: Date/time handling.
  - `openTimeModal()`, `closeTimeModal()`, `confirmTimeSelection()`: Time picker modal logic.
  - `endDateAfterStartDateValidator()`: Custom validator for date range.
- **Error Handling**:
  - Uses `ToastrService` for user feedback.
  - Uses `UpgradeNotificationService` for subscription/limit notifications.
- **UI**:
  - Stepper, forms, location grid, media upload, time picker modal, and navigation buttons.
  - Animations for transitions and feedback.

---

## 5. `customer-campaigns` Component

### Purpose
Allows admins to review, approve, reject, and delete customer-submitted campaigns. Displays campaign stats, supports filtering, and integrates with real-time updates.

### Logic
- **State Management**:
  - `campaigns`, `allCampaigns`: Arrays of campaign objects.
  - `loading`: Indicates loading state.
  - `filterStatus`, `searchTerm`: For filtering campaigns.
  - `selectedCampaign`, `showRejectionModal`, `showDeleteModal`, `rejectionReason`: Modal and rejection state.
  - `campaignStats`: Tracks counts for each status.
  - `approvingCampaignId`, `rejectingCampaign`, `deletingCampaignId`: Action state.
- **Lifecycle**:
  - `ngOnInit()`: Loads campaigns, sets navigation, and subscribes to socket events for real-time updates.
  - `ngOnDestroy()`: Unsubscribes from all socket subscriptions.
- **Core Methods**:
  - `getAllCampaigns()`, `getCampaigns()`, `filterCampaigns()`, `updateCampaignStats()`: Data and filtering logic.
  - `approveCampaign()`, `openRejectionModal()`, `rejectCampaign()`, `closeRejectionModal()`: Approval/rejection logic.
  - `openDeleteModal()`, `closeDeleteModal()`, `deleteCampaign()`: Deletion logic.
  - `getStatusClass()`: Returns CSS classes for campaign status.
- **Error Handling**:
  - Uses `ToastrService` for user feedback.
  - Uses `LoggingService` for error logging.
- **UI**:
  - Campaign cards, status badges, media previews, action buttons, and modals for rejection and deletion.
  - Quick stats bar and filtering.
  - Animations for transitions and status changes.

---

## 6. SCSS and Spec Files
- SCSS files provide styling and animation for each component. No business logic.
- Spec files are for unit testing component creation. No business logic.

---

## 7. Service and Data Structure Uncertainty
If any service method or data structure is unclear, a log statement must be inserted in the relevant file. The user must run the code and provide the following log output:
- The full output of the log statement(s) inserted.
- The context in which the log was triggered (e.g., which action or user flow).

---

## End of Campaigns Module Documentation 