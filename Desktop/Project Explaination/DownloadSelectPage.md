# Download Select Page Module (Electron Desktop App)

This document details the logic, structure, and flow of the Download Select Page module in the Electron Angular desktop application. It covers the following files:
- download-select-page.component.ts
- download-select-page.component.html
- download-select-page.component.css
- download-select-page.component.spec.ts

---

## Purpose

The Download Select Page module allows users to view, select, and initiate downloads of available ad campaigns. It provides a table of campaigns, supports bulk selection, and integrates with campaign and socket services for real-time updates.

---

## download-select-page.component.ts

- **Component Type:** Standalone Angular component.
- **UI Imports:** CommonModule, RouterLink, NavbarComponent.
- **State Variables:**
  - `campaigns`: Array of campaign objects fetched from the backend.
  - `selectedCampaigns`: Array of selected campaign IDs.
  - `selectAll`: Boolean, true if all campaigns are selected.
  - `showControls`: Boolean, toggles window controls (for mouse movement UI, not shown in template).
  - `hideTimeout`: Timeout handler for hiding controls.
  - `objectKeys`: Utility for template iteration.
  - `showBackButton`: Boolean, always true (for navbar back button).
  - `campaignSubscription`: Subscription to socket events for new campaigns.
  - `isLoading`: Boolean, true while campaigns are being fetched.
  - `errorMessage`: String, displays error messages to the user.

- **Lifecycle Hooks:**
  - `ngOnInit()`: Fetches campaigns from the backend and subscribes to new campaign events via socket. Adds a mousemove event listener for UI controls.
  - `ngOnDestroy()`: Cleans up event listeners and subscriptions.

- **Campaign Fetching:**
  - `getCampaigns()`: Calls `campaignService.getCampaigns()` to fetch available campaigns. On success, populates `campaigns` and selects all by default. On error, logs and displays an error message.

- **Socket Integration:**
  - Subscribes to `socketService.getNewCampaigns()` for real-time campaign additions. Adds new campaigns to the list and auto-selects them if not already present.

- **Selection Logic:**
  - `toggleCampaign(id)`: Adds/removes a campaign from `selectedCampaigns`.
  - `toggleSelectAll()`: Selects/deselects all campaigns.
  - `updateSelectAllState()`: Updates `selectAll` based on current selection.

- **Download Logic:**
  - `downloadSelected()`: Validates selection, sets selected campaigns in `campaignService`, and navigates to the download status page.

- **UI Controls:**
  - `handleMouseMove(event)`: Shows/hides window controls based on mouse position (not directly reflected in template).
  - `closeWindow()`, `minimizeWindow()`: Call Electron service methods to control the app window.

- **Logging/Unknown Data:**
  - Uses `loggingService.log()` for error logging.
  - If the structure of data from `campaignService.getCampaigns()` or `socketService.getNewCampaigns()` is unclear, insert log statements to capture the full response and error objects at runtime.
  - To clarify, log:
    - The result of `getCampaigns()`
    - The data received in each `getNewCampaigns()` event

---

## download-select-page.component.html

- **Layout:**
  - Includes a custom `<app-navbar>` for window controls and back navigation.
  - Page header with title and instructions.
  - Error message display if `errorMessage` is set.
  - Loading state with spinner and message while campaigns are being fetched.
  - Table of campaigns with columns for selection, ID, title, date range, time range, and location(s).
  - "Select All" checkbox for bulk selection.
  - Each campaign row is clickable and highlights when selected.
  - Download button to initiate download of selected campaigns.
  - Empty state message if no campaigns are available.

---

## download-select-page.component.css

- **.highlight-animation:**
  - Defines a keyframe animation for highlighting rows (not directly used in the provided template, but available for future use).

---

## download-select-page.component.spec.ts

- **Test:**
  - Basic test to ensure the component is created successfully.
  - No further logic or UI tests are present.

---

## Integration Points

- Relies on CampaignService for fetching and setting campaigns.
- Uses SocketService for real-time campaign updates.
- Uses ElectronService for window control.
- Uses LoggingService for error logging.
- UI is styled with Tailwind CSS utility classes and custom CSS for row highlighting.
- Uses Angular Router for navigation.
- Uses Angular's standalone component pattern.

---

## Logging and Unclear Data Handling

- If the structure of any data returned by CampaignService or SocketService methods is unclear, add log statements in the relevant methods and run the app to capture:
  - The full result of `getCampaigns()`
  - The full data object from each `getNewCampaigns()` event
- Provide the following logs for analysis:
  - Output of `getCampaigns()`
  - Data received in `getNewCampaigns()`

---

This documentation covers the complete logic and flow of the Download Select Page module in the Electron Angular desktop application, including all user-facing campaign selection, download initiation, real-time updates, and integration with campaign and socket services. 