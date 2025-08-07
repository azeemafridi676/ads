# Video Play Page Component (Electron Desktop App)

This document provides an exhaustive explanation of the logic, structure, and flow of `video-play-page.component.ts` in the Electron Angular desktop application. This component orchestrates the core ad playback logic, integrating campaign cycles, location-based filtering, download management, media playback, and external display synchronization.

---

## Purpose

The Video Play Page is the central hub for ad playback in the desktop app. It manages:
- The download and playback of campaign media (video/image) based on the user's current location and campaign schedule.
- The enforcement of campaign run cycle limits (subscription logic).
- Real-time updates from the backend (via sockets) and device location.
- Synchronized playback on an external display (e.g., van-mounted screen).
- UI state for playlist, download queue, playback controls, and error/warning indicators.
- Map integration for location context.

---

## High-Level Structure

- **Component Type:** Standalone Angular component.
- **UI Imports:** CommonModule, VideoPlayerComponent, NavbarComponent, GoogleMapsModule.
- **Template:** Inline, with two main sections: left (video/map) and right (controls, playlist, download queue).
- **Styles:** Inline, extensive for layout, playlist, download queue, and playback controls.

---

## State Variables and Data Structures

- **Media and Playback:**
  - `currentMedia`: The currently playing media item (video/image, path, duration).
  - `currentlyPlayingId`: Tracks the ID of the currently playing campaign/media.
  - `playQueue`: Array of campaigns/media currently eligible for playback (location/time filtered).
  - `currentQueueIndex`: Index of the currently playing item in `playQueue`.
  - `imageTimer`, `remainingTime`: For image display countdown.
  - `isTransitioning`: Prevents overlapping transitions between media.
  - `noMediaMessage`: Message shown when no media is available.

- **Download Management:**
  - `downloadQueue`: Array of campaigns queued for download, with status/progress.
  - `pendingCampaigns`: Map of campaigns received via socket but not yet downloaded.
  - `isDownloading`: Flag to prevent concurrent downloads.

- **Campaign and Subscription:**
  - `campaigns`: All campaigns available for playback.
  - `currentCampaignIds`: Set of campaign IDs currently in the play queue (for change detection).
  - `locationStack`: Recent device locations (for cycle update context).
  - `MAX_STACK_SIZE`: Limit for location history.
  - `warningMap`: Map of campaign IDs to warning state (for subscription cycle warnings).

- **Location and Map:**
  - `locationSubscription`: Subscription to location updates.
  - `showLocationUpdate`: UI flag for location update indicator.
  - `showMap`, `isGoogleMapsLoaded`: Toggles map/video view and tracks map load state.
  - `markers`, `infoWindows`, `currentLocationMarker`, `routesService`, `currentPolyline`, `isRouteCalculated`: Google Maps objects and state.
  - `routeUpdateTimer`: Timer for periodic map reinitialization.

- **UI and Controls:**
  - `showBackButton`: For navbar.
  - `campaignSubscription`: Subscription to socket campaign updates.

---

## Core Logic and Methods

### 1. Initialization and Lifecycle
- **ngOnInit:**
  - Loads Google Maps in the background.
  - Subscribes to new campaign events via socket, adding them to the download queue.
  - Retrieves display configuration and creates an external window for ad playback.
  - Loads playable campaigns from CampaignService.
  - Subscribes to location updates, updating the play queue and UI on each change.
- **ngOnDestroy:**
  - Cleans up subscriptions, timers, and closes the external window.

### 2. Download Queue Management
- **addToDownloadQueue:** Adds campaigns to the download queue if within cycle limits.
- **processDownloadQueue:** Sequentially downloads campaigns, updating status and progress.
- **downloadFile:** Handles the download process for a campaign, updates backend and local state, manages errors.
- **retryDownload:** Allows retrying failed downloads.

### 3. Play Queue and Media Management
- **getValidMediaForLocation:** Filters campaigns based on current location, date, and time window. Only campaigns within radius and active schedule are eligible.
- **updateMediaQueue:** Updates the play queue when location or campaign set changes. Handles transitions if the current media is no longer valid.
- **playQueueItem:** Loads and plays a specific item from the play queue, handling errors and transitions.
- **playCurrentQueueItem, playNext, playPrevious:** Navigation and playback control within the queue.
- **displayMedia:** Loads and displays a media item, synchronizing with the external display.
- **cleanupCurrentMedia:** Cleans up timers and state before transitioning to new media.
- **shouldUpdateMedia:** Determines if a new media item should be loaded.

### 4. Media Playback and Transitions
- **onMediaEnded:** Handles the end of a video/image, updates campaign cycle, removes completed campaigns, and transitions to the next item.
- **onImageLoaded, startImageTimer, onImageTimerComplete:** Manages image display duration and transitions.
- **handleVideoError:** Handles playback errors, marks items as having errors, and skips to the next item.

### 5. Campaign Cycle and Subscription Logic
- **updateCampaignCycle:** Calls backend to increment campaign cycle and update location. Handles subscription completion and removes campaigns as needed.
- **updateSubscriptionData:** Updates local campaign and queue state based on backend subscription data.
- **updateWarnings, getWarningState:** Tracks and displays warnings when a campaign's subscription is nearing its cycle limit.
- **hasCampaignsChanged:** Detects changes in the set of campaigns eligible for playback.

### 6. Location and Map Integration
- **locationStack:** Maintains recent locations for context in cycle updates.
- **updateCurrentLocation, updateOptimalRoute, calculateOptimalRoute, drawSimpleRoute:** Handles map marker updates and route drawing using Google Maps API.
- **toggleView, initializeMap, startRouteUpdateTimer, clearRouteUpdateTimer:** Manages map/video view toggling and periodic map updates.

### 7. External Display Synchronization
- **electronService.syncVideoAction:** Sends playback actions (load, clear) to the external display for synchronized ad playback.
- **electronService.createExternalWindow, closeExternalWindow:** Manages the external display window lifecycle.

### 8. Error Handling and Logging
- Extensive use of logging (console and LoggingService) for all major state changes, transitions, errors, and edge cases.
- Handles download, playback, and subscription errors gracefully, updating UI and state accordingly.

### 9. UI State and Feedback
- **showLocationUpdate:** Briefly highlights when a new location update is received.
- **noMediaMessage:** Informs the user when no media is available for playback.
- **warningMap, getWarningState:** Displays warnings for campaigns nearing subscription cycle limits.
- **hasPlaybackError:** Flags campaigns with playback issues in the playlist.

---

## Interplay Between Campaign Cycles, Location, and Playback
- Only campaigns that are within the user's current location radius, active date/time window, and not exceeding their run cycle limit are eligible for playback.
- Each time a media item finishes playing, the campaign's cycle count is incremented and updated in the backend, along with the current location.
- If a campaign's subscription is completed (cycle limit reached), it is removed from the play queue and campaigns list.
- The play queue is dynamically updated as the user's location changes, ensuring only valid campaigns are played.
- Warnings are shown when a campaign is nearing its cycle limit.

---

## Edge Case and Transition Handling
- Handles empty play queue (no valid campaigns) by clearing playback and external display.
- Prevents overlapping transitions with `isTransitioning` flag.
- Handles download and playback errors, allowing retries and skipping problematic items.
- Ensures UI and external display are always in sync with the current playback state.
- Manages image and video playback distinctly, with timers for images and event-based transitions for videos.

---

## Service Interactions
- **CampaignService:** Fetches campaigns, updates download status, updates campaign cycles and location.
- **ElectronService:** Handles file downloads, local file URLs, external display sync, window controls, and location updates.
- **SocketService:** Receives real-time campaign updates and connection status.
- **AuthService:** Handles logout.
- **LoggingService:** Logs errors and state changes.

---

## External Display Integration and Synchronization

The Video Play Page is tightly integrated with the external display logic, which is responsible for showing the current ad (video or image) on a secondary screen (e.g., the van-mounted display). This is achieved through the following components:

- **external-display.component.ts:**
  - Runs in the external display window, listens for media sync actions from the main app via Electron's IPC (inter-process communication).
  - Handles actions such as `loadVideo`, `play`, `pause`, `seek`, `volume`, `clearMedia`, and `ended`.
  - Updates the video or image element on the external display according to the received action, ensuring the external screen always mirrors the main app's playback state.
  - Handles media loading, playback, error events, and looped playback for videos.

- **external.component.ts / external.module.ts:**
  - Provides the Angular module and root component for the external display window.
  - Sets up the container for the external media display, but delegates all playback logic to `external-display.component.ts`.

- **Synchronization Flow:**
  - The main Video Play Page uses `electronService.syncVideoAction()` to send playback actions to the external display window.
  - Actions include loading a new video/image, starting/stopping playback, clearing the display, and updating playback state.
  - The external display component receives these actions and updates its UI accordingly, ensuring seamless, real-time synchronization between the operator's screen and the public-facing display.
  - This architecture guarantees that every ad played in the van is shown identically on both the control laptop and the external screen, with robust error handling and state management on both sides.

---

## Logging and Unclear Data Handling
- Extensive logging is present throughout the component for debugging and state tracking.
- If the structure of any data returned by ElectronService, CampaignService, or SocketService is unclear, add log statements in the relevant methods and run the app to capture:
  - The full result of campaign downloads, cycle updates, and location updates.
  - The full data object from each socket and Electron event.
- Provide the following logs for analysis:
  - Output of campaign downloads and errors.
  - Data received in location updates.
  - Responses from campaign cycle updates.

---

## Summary

This component is the most complex and critical part of the desktop app, integrating real-time location, campaign scheduling, subscription enforcement, download management, media playback, and external display synchronization. It ensures that only valid campaigns are played, enforces subscription limits, handles all edge cases and errors, and provides a robust, user-friendly interface for ad playback in a mobile environment. 