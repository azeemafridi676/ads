# Download Status Page Module (Electron Desktop App)

This document details the logic, structure, and flow of the Download Status Page module in the Electron Angular desktop application. It covers the following files:
- download-status-page.component.ts
- download-status-page.component.html
- download-status-page.component.css
- download-status-page.component.spec.ts

---

## Purpose

The Download Status Page module allows users to track the progress of campaign downloads, retry failed downloads, and proceed to the map preview once all downloads are complete. It manages download state, progress, and error handling for each campaign.

---

## download-status-page.component.ts

- **Component Type:** Standalone Angular component.
- **UI Imports:** CommonModule, NavbarComponent.
- **State Variables:**
  - `selectedCampaigns`: Array of campaigns selected for download (from CampaignService).
  - `downloadStatus`: Object mapping campaign IDs to their download status (`pending`, `downloading`, `completed`, `error`) and progress percentage.
  - `allDownloadsComplete`: Boolean, true if all downloads are completed.
  - `showControls`: Boolean, toggles window controls (for mouse movement UI, not shown in template).
  - `hideTimeout`: Timeout handler for hiding controls.
  - `showBackButton`: Boolean, always true (for navbar back button).
  - `copiedPath`: String, tracks the last copied download path.
  - `showCopyFeedback`: Object mapping download paths to boolean for copy feedback UI.

- **Lifecycle Hooks:**
  - `ngOnInit()`: Initializes download status for each campaign, starts downloads, subscribes to download progress events from ElectronService, and adds mousemove event listener.
  - `ngOnDestroy()`: Cleans up event listeners.

- **Download Management:**
  - `initializeDownloads()`: Checks if campaigns are already downloaded, updates status, and starts downloads for pending campaigns.
  - `startDownloads()`: Iterates over selected campaigns and calls `downloadFile()` for each pending campaign.
  - `downloadFile(campaign)`: Handles the download process for a campaign:
    - Checks if already downloaded (and file exists), otherwise starts download via ElectronService.
    - Updates download status and progress.
    - On success, updates campaign download path in the backend and local state.
    - On error, sets error status and message.
  - `retryDownload(campaign)`: Retries download for a single failed campaign.
  - `retryAllFailed()`: Retries downloads for all failed campaigns.
  - `checkAllDownloadsComplete()`: Checks if all downloads are complete and updates state. Sets downloaded campaigns in CampaignService.

- **Progress and Status:**
  - Subscribes to `electronService.onDownloadProgress()` to update progress and status in real time.
  - `getFileType(url)`, `getFileExtension(url)`: Helpers to determine file type and extension.
  - `getErrorMessage(error)`: Maps error messages to user-friendly strings.
  - `updateCampaignDownloadPath(campaignId, downloadPath)`: Updates campaign's download path and status in local state.

- **Navigation:**
  - `goToMapPreviewPage()`: Navigates to the map preview page if all downloads are complete and playable campaigns are available.

- **UI Controls:**
  - `handleMouseMove(event)`: Shows/hides window controls based on mouse position (not directly reflected in template).
  - `closeWindow()`, `minimizeWindow()`: Call Electron service methods to control the app window.

- **Clipboard:**
  - `copyToClipboard(text)`: Copies the download path to clipboard and shows feedback UI.

- **Logging/Unknown Data:**
  - Uses `loggingService.log()` for error logging.
  - If the structure of data from ElectronService or CampaignService is unclear, insert log statements to capture the full response and error objects at runtime.
  - To clarify, log:
    - The result of `downloadFile()` and `electronService.downloadFile()`
    - The data received in each `electronService.onDownloadProgress()` event

---

## download-status-page.component.html

- **Layout:**
  - Includes a custom `<app-navbar>` for window controls and back navigation.
  - Page header with title and instructions.
  - Loading state with spinner and message while campaigns are being loaded.
  - Table of selected campaigns with columns for ID, title, date range, status, download path, and action.
  - Status column shows pending, downloading (with progress bar), completed, or error.
  - Download path column allows copying the path to clipboard with feedback.
  - Action column allows retrying failed downloads, shows status for others.
  - Action buttons for retrying all failed downloads and proceeding to map preview (enabled only if all downloads are complete).

---

## download-status-page.component.css

- **Content:** Empty (no custom styles).

---

## download-status-page.component.spec.ts

- **Test:**
  - Basic test to ensure the component is created successfully.
  - No further logic or UI tests are present.

---

## Integration Points

- Relies on CampaignService for selected campaigns, updating download status, and navigation to map preview.
- Uses ElectronService for file downloads, progress updates, file existence checks, and window control.
- Uses LoggingService for error logging.
- UI is styled with Tailwind CSS utility classes.
- Uses Angular Router for navigation.
- Uses Angular's standalone component pattern.

---

## Logging and Unclear Data Handling

- If the structure of any data returned by ElectronService or CampaignService methods is unclear, add log statements in the relevant methods and run the app to capture:
  - The full result of `downloadFile()` and `electronService.downloadFile()`
  - The full data object from each `electronService.onDownloadProgress()` event
- Provide the following logs for analysis:
  - Output of `downloadFile()`
  - Output of `electronService.downloadFile()`
  - Data received in `electronService.onDownloadProgress()`

---

This documentation covers the complete logic and flow of the Download Status Page module in the Electron Angular desktop application, including all user-facing download tracking, error handling, retry logic, and integration with campaign and Electron services. 