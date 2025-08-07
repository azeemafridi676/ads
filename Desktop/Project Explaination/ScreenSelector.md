# Screen Selector Module (Electron Desktop App)

This document details the logic, structure, and flow of the Screen Selector module in the Electron Angular desktop application. It covers the following files:
- screen-selector.component.ts
- screen-selector.component.html
- screen-selector.component.css
- screen-selector.component.spec.ts

---

## Purpose

The Screen Selector module allows users to select which display (internal or external) the desktop app should use for ad playback. It detects all available screens, shows their properties and thumbnails, and stores the user's selection for use in external display management.

---

## screen-selector.component.ts

- **Component Type:** Standalone Angular component.
- **UI Imports:** CommonModule, RouterLink, NavbarComponent.
- **State Variables:**
  - `displays`: Array of detected display objects, each with resolution and optional thumbnail.
  - `selectedDisplay`: The currently selected display.
  - `error`: String, displays error messages to the user.
  - `thumbnailInterval`: Timer for periodic thumbnail updates.

- **Lifecycle Hooks:**
  - `ngOnInit()`: Calls `loadDisplays()` to fetch available displays and starts a timer to update thumbnails every 2 seconds.
  - `ngOnDestroy()`: Clears the thumbnail update timer.

- **Display Detection and Thumbnails:**
  - `loadDisplays()`: Calls `electronService.getDisplays()` to fetch all available screens. Adds physical resolution to each display object. Calls `updateThumbnails()` to fetch screen previews. Selects the first display by default.
  - `updateThumbnails()`: For each display, attempts to fetch a thumbnail image using the display's ID. Falls back to index-based ID if needed. Updates the display object with the thumbnail.

- **Display Selection:**
  - `selectDisplay(display)`: Sets the selected display and stores its configuration (ID, name, physical resolution, bounds, scale factor) in localStorage for later use by the app and external display logic.

- **UI Controls:**
  - `closeWindow()`, `minimizeWindow()`: Call Electron service methods to control the app window.

- **Logging/Unknown Data:**
  - Uses LoggingService for error logging (not shown in template, but injected).
  - If the structure of data from ElectronService is unclear, insert log statements to capture the full response and error objects at runtime.
  - To clarify, log:
    - The result of `getDisplays()`
    - The data received from `getScreenThumbnail()`

---

## screen-selector.component.html

- **Layout:**
  - Contains a navbar for window controls.
  - Page header with title.
  - Error message display if `error` is set.
  - Grid of available displays, each showing name, type (internal/external), thumbnail, scaled and physical resolution, scale factor, position, rotation, and touch support.
  - Selected display is highlighted.
  - Navigation buttons for going back or proceeding to the next step (disabled if no display is selected).

---

## screen-selector.component.css

- **Content:** Empty (no custom styles).

---

## screen-selector.component.spec.ts

- **Test:**
  - Basic test to ensure the component is created successfully.
  - No further logic or UI tests are present.

---

## Integration Points

- Relies on ElectronService for fetching display information and thumbnails, and for window control.
- Uses LoggingService for error logging.
- UI is styled with Tailwind CSS utility classes.
- Uses Angular Router for navigation.
- Uses Angular's standalone component pattern.

---

## Logging and Unclear Data Handling

- If the structure of any data returned by ElectronService methods is unclear, add log statements in the relevant methods and run the app to capture:
  - The full result of `getDisplays()`
  - The full data object from each `getScreenThumbnail()` call
- Provide the following logs for analysis:
  - Output of `getDisplays()`
  - Data received from `getScreenThumbnail()`

---

This documentation covers the complete logic and flow of the Screen Selector module in the Electron Angular desktop application, including all user-facing display selection, thumbnail preview, and integration with Electron services. 