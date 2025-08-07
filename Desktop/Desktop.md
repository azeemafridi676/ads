# Ads Electron Desktop App

## Overview
This project is the Electron-based desktop application for the Ads platform. It is designed for robust, real-time ad playback in mobile environments (e.g., van-mounted screens), integrating campaign management, location-based filtering, download management, synchronized external display, and secure communication between Angular and Electron. The app is modular, secure, and optimized for both operator and public-facing screens.

---

## Application Structure
- **src/app/**: Angular application source code, organized by feature modules and shared services.
- **Project Explaination/**: In-depth documentation for each module and feature.
- **public/**: Static assets (favicon, etc.).
- **main.js**: Electron main process, system-level operations, window management, IPC handlers.
- **preload.js**: Context bridge, exposes secure API to Angular.

---

## Core Modules & Features

### 1. **Authentication**
- Handles login, signup, password reset, OTP verification.
- Uses Angular Reactive Forms, validation, and secure token management.
- Guards all protected routes, ensuring only authenticated users access core features.

### 2. **Create Connection**
- Guides the user to connect the desktop app to a mobile device running the Traccar Client app.
- Manages connection status, displays real-time location updates, and provides step-by-step setup instructions.
- Ensures both devices are on the same network and handles all connection logic via Electron IPC.

### 3. **Download Select & Status Pages**
- Allows users to view, select, and initiate downloads of available ad campaigns.
- Tracks download progress, handles errors, and supports retry logic.
- Integrates with backend and Electron for file downloads, progress events, and campaign status updates.

### 4. **Map Preview Page**
- Visualizes campaign locations and the current device location on a map.
- Uses Google Maps integration for geospatial context.
- Shows optimal routes and campaign coverage.

### 5. **Screen Selector**
- Lets the user select which physical display to use for the external (public-facing) screen.
- Captures display thumbnails and manages display configuration.

### 6. **Video Play Page (Core Functionality)**
**This is the heart of the desktop app.**
- **Ad Playback:**
  - Manages the download and playback of campaign media (video/image) based on current location and campaign schedule.
  - Enforces campaign run cycle limits (subscription logic).
  - Filters campaigns in real time using device location, campaign schedule, and subscription status.
- **Download Management:**
  - Maintains a download queue for campaigns, tracks progress, handles errors, and supports retries.
  - Downloads are managed via Electron IPC, with progress events and error handling.
- **Play Queue:**
  - Dynamically updates the play queue as location or campaign set changes.
  - Only campaigns within the current location radius, active date/time window, and not exceeding their run cycle limit are eligible for playback.
  - Handles transitions, playback errors, and edge cases (e.g., empty queue, completed subscriptions).
- **Media Playback:**
  - Supports both video and image playback, with timers for images and event-based transitions for videos.
  - UI provides playlist, download queue, playback controls, and error/warning indicators.
- **External Display Synchronization:**
  - Synchronously mirrors ad playback on a secondary (external) display (e.g., van-mounted screen).
  - Uses Electron IPC to send playback actions (load, play, pause, clear, etc.) to the external window.
  - Ensures the public-facing screen always matches the operator's playback state, with robust error handling.
- **Location & Map Integration:**
  - Subscribes to real-time location updates from the Traccar client.
  - Updates play queue and UI based on location.
  - Integrates Google Maps for visualizing campaign and device locations, optimal routes, and coverage.
- **Subscription & Cycle Enforcement:**
  - Increments campaign cycle count after each playback, updates backend, and removes campaigns when subscription is completed.
  - Displays warnings when a campaign is nearing its cycle limit.
- **Error Handling & Logging:**
  - Extensive logging for all major state changes, transitions, errors, and edge cases.
  - UI feedback for download errors, playback issues, and subscription warnings.

---

## Electron-Angular Communication Architecture
- **main.js:** Handles all privileged operations (window management, file downloads, network, display detection, campaign updates, location updates, external display sync). Registers IPC handlers and manages the lifecycle of main and external windows.
- **preload.js:** Exposes a secure API (`electronAPI`) to Angular via contextBridge. Wraps all IPC calls, event listeners, and privileged operations. Ensures Angular cannot access Node.js or Electron internals directly.
- **electron.service.ts:** Angular service layer. Detects Electron environment, wraps all `electronAPI` methods, and exposes them as Promises or RxJS Observables. Handles all Electron-related features (downloads, window/display control, campaign management, sync, etc.) in a type-safe, Angular-friendly way.
- **All privileged operations are performed in the main process, never in the renderer.**
- **All communication is promise-based or observable-based, ensuring real-time, reliable operation for all core features.**

---

## Technical Highlights
- **Angular:** Standalone components, modular architecture, Reactive Forms, Routing, Guards, Animations.
- **Electron:** Secure context isolation, IPC for all system-level operations, robust window and display management.
- **Real-Time:** Socket and IPC integration for live campaign, download, and location updates.
- **UI/UX:** Tailwind CSS, responsive layouts, modals, skeleton loaders, and clear feedback for all states.
- **Google Maps:** Integrated for location visualization and route optimization.
- **Error Handling:** Toastr notifications, UI feedback, and extensive logging for all major actions.

---

## Getting Started
1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Run the Electron app:**
   ```bash
   npm run electron:start
   ```
3. **Follow the on-screen instructions to connect, select campaigns, download, and start ad playback.**

---

## Contribution & Support
- The codebase is documented in the `Project Explaination/` directory for each module.
- For questions about data structures or unclear logic, follow the logging instructions in the documentation and provide the required log output.

---

## License
This project is proprietary and not open source. All rights reserved.
