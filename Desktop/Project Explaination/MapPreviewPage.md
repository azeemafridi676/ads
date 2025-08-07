# Map Preview Page Module (Electron Desktop App)

This document details the logic, structure, and flow of the Map Preview Page module in the Electron Angular desktop application. It covers the following files:
- map-preview-page.component.ts
- map-preview-page.component.html
- map-preview-page.component.css
- map-preview-page.component.spec.ts

---

## Purpose

The Map Preview Page module displays a Google Map with campaign locations, the current device location, and an optimal route connecting all campaign points. It allows the user to preview the route before starting ad playback.

---

## map-preview-page.component.ts

- **Component Type:** Standalone Angular component.
- **UI Imports:** CommonModule, GoogleMapsModule, NavbarComponent.
- **State Variables:**
  - `isGoogleMapsLoaded`: Boolean, true when Google Maps API is loaded.
  - `showBackButton`: Boolean, always true (for navbar back button).
  - `markers`: Array of Google Maps Marker objects for campaign locations.
  - `infoWindows`: Array of InfoWindow objects for marker popups.
  - `currentLocationMarker`: Marker for the device's current location.
  - `locationSubscription`: Subscription to location updates from ElectronService.
  - `mapOptions`: Google Maps options (center, zoom, styles, etc.).
  - `routesService`: Google Maps DirectionsService for routing (initialized after map load).
  - `currentPolyline`: Polyline object for the displayed route.
  - `isRouteCalculated`: Boolean, ensures route is only calculated once per session.
  - `SOURCE_FILE`: String, for logging context.

- **Lifecycle Hooks:**
  - `ngOnInit()`: Loads Google Maps API, initializes map, loads campaign locations, and starts location updates.
  - `ngOnDestroy()`: Cleans up location subscription.

- **Map and Marker Logic:**
  - `loadGoogleMaps()`: Dynamically loads the Google Maps API script if not already loaded.
  - `loadCampaignLocations()`: Fetches playable campaigns from CampaignService, creates markers for each location, and info windows for details. Fits map bounds to show all markers.
  - `updateCurrentLocation(location)`: Updates or creates the current location marker with a pulse effect.

- **Route Logic:**
  - `startLocationUpdates()`: Subscribes to ElectronService location updates, updates current location, and triggers route calculation.
  - `updateOptimalRoute()`: Calculates and displays the optimal route connecting all campaign locations in a circular pattern, starting and ending at the current location. Uses Google Routes API if available, falls back to a simple route otherwise. Draws polylines for the route and an outline for visibility.
  - `calculateOptimalRoute(start, destinations)`: Implements a nearest-neighbor algorithm to order campaign locations for the route, then creates a circular repeating route pattern.
  - `drawSimpleRoute(route)`: Draws a simple polyline if the API route fails.
  - `recalculateRoute()`: Public method to force recalculation of the route.

- **Distance Calculation:**
  - `calculateDistance(lat1, lon1, lat2, lon2)`: Haversine formula for distance between two points.
  - `deg2rad(deg)`: Helper for radians conversion.

- **Navigation:**
  - `goToVideoPlayPage()`: Navigates to the video play page if playable or downloaded campaigns are available.

- **UI Controls:**
  - `minimizeWindow()`, `closeWindow()`: Call Electron service methods to control the app window.

- **Logging/Unknown Data:**
  - Uses LoggingService for error logging throughout.
  - If the structure of data from ElectronService, CampaignService, or Google Maps API is unclear, insert log statements to capture the full response and error objects at runtime.
  - To clarify, log:
    - The result of Google Maps API loading
    - The data received in each location update
    - The response from the Routes API

---

## map-preview-page.component.html

- **Layout:**
  - Contains a map container with a Google Map component.
  - Shows a loading message until the map is ready.
  - Displays a custom navbar overlayed on the map.
  - "Start Playing" button at the bottom to proceed to ad playback.

---

## map-preview-page.component.css

- **.map-container:** Styles the map container for full viewport display.
- **google-map:** Ensures the map fills the container.
- **.loading:** Centers the loading message over the map.
- **app-navbar:** Overlays the navbar above the map, allows pointer events for buttons only.
- **.start-playing-button:** Styles the "Start Playing" button with color, hover, and shadow effects.

---

## map-preview-page.component.spec.ts

- **Test:**
  - Basic test to ensure the component is created successfully.
  - No further logic or UI tests are present.

---

## Integration Points

- Relies on CampaignService for playable/downloaded campaigns and their locations.
- Uses ElectronService for location updates and window control.
- Uses LoggingService for error logging.
- Uses Google Maps API for map, markers, and routing.
- UI is styled with Tailwind CSS utility classes and custom CSS for map and button overlays.
- Uses Angular Router for navigation.
- Uses Angular's standalone component pattern.

---

## Logging and Unclear Data Handling

- If the structure of any data returned by ElectronService, CampaignService, or Google Maps API is unclear, add log statements in the relevant methods and run the app to capture:
  - The full result of Google Maps API loading
  - The full data object from each location update
  - The full response from the Routes API
- Provide the following logs for analysis:
  - Output of Google Maps API loading
  - Data received in location updates
  - Response from the Routes API

---

This documentation covers the complete logic and flow of the Map Preview Page module in the Electron Angular desktop application, including all user-facing map display, route calculation, marker management, and integration with campaign, Electron, and Google Maps services. 