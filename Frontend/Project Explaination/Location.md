# Location Module Documentation

## Overview
The Location module manages the creation, editing, and listing of advertising locations. It includes components for adding new locations, editing existing ones, and listing all locations. The module integrates with location, authentication, navigation, and notification services, and uses Google Maps for geospatial input.

---

## 1. `addlocation` Component

### Purpose
Allows users to add a new advertising location, specifying details and selecting a location on a map. Enforces subscription and plan limits for location count and radius.

### Logic
- **State Management**:
  - `addLocationForm`: Reactive form for location details (name, country, state).
  - `currentStep`: Tracks the current step in the multi-step process.
  - `states`, `selectedState`: List of available states and the selected state.
  - `currentSubscription`, `locationLimit`, `currentLocations`: Subscription and limit tracking.
  - Map properties: `mapOptions`, `center`, `markerPosition`, `circleOptions`, `selectedLocation`, `radiusValue`, `maxRadius`, `minRadius`, `attemptedRadius`.
- **Lifecycle**:
  - `ngOnInit()`: Fetches states, user details, and sets navigation titles.
- **Core Methods**:
  - `fetchStates()`, `onStateChange()`, `initializeMapForState()`: State and map setup.
  - `onMapClick()`, `isWithinStateBounds()`: Handles map interaction and validation.
  - `onRadiusInput()`, `updateCircleRadius()`: Handles radius input and updates.
  - `nextStep()`, `previousStep()`: Step navigation.
  - `onSubmit()`, `handleSubmitClick()`: Submits new location data, enforcing limits.
  - `showSubscriptionRequiredNotification()`, `showRadiusLimitNotification()`, `showLocationLimitNotification()`: Notifies user of plan restrictions.
  - `checkLocationLimit()`: Checks current location count.
- **Error Handling**:
  - Uses `ToastrService` and notification service for user feedback.
- **UI**:
  - Multi-step form, map with marker and radius, radius controls, and navigation buttons.
  - Responsive layout and loading states.

---

## 2. `edit-location` Component

### Purpose
Allows users to edit an existing advertising location, updating details and map position. Enforces subscription and plan limits for radius.

### Logic
- **State Management**:
  - `editLocationForm`: Reactive form for location details.
  - `currentStep`, `locationId`, `states`, `selectedState`, `currentSubscription`: State and plan tracking.
  - Map properties: `mapOptions`, `center`, `markerPosition`, `circleOptions`, `selectedLocation`, `radiusValue`, `maxRadius`, `minRadius`, `attemptedRadius`, `circleInstance`.
- **Lifecycle**:
  - `ngOnInit()`: Loads location data, fetches states, user details, and sets navigation titles.
  - `ngAfterViewInit()`: Initializes map for state after view is ready.
  - `ngOnDestroy()`: Cleans up map circle instance.
- **Core Methods**:
  - `loadLocationData()`, `fetchStates()`, `onStateChange()`, `initializeMapForState()`: Data and map setup.
  - `onMapClick()`, `isWithinStateBounds()`: Handles map interaction and validation.
  - `onRadiusInput()`, `updateCircleRadius()`: Handles radius input and updates.
  - `nextStep()`, `previousStep()`: Step navigation.
  - `onSubmit()`: Submits updated location data, enforcing limits.
  - `showSubscriptionRequiredNotification()`, `showRadiusLimitNotification()`: Notifies user of plan restrictions.
- **Error Handling**:
  - Uses `ToastrService` and notification service for user feedback.
- **UI**:
  - Multi-step form, map with marker and radius, radius controls, and navigation buttons.
  - Responsive layout and loading states.

---

## 3. `locations-list` Component

### Purpose
Displays a list of all advertising locations, with options to edit or delete locations. Prevents editing or deleting locations used in approved campaigns.

### Logic
- **State Management**:
  - `locations`: Array of location objects.
  - `loading`, `searchTerm`: Loading and search state.
  - `showDeleteModal`, `locationToDelete`: Modal and deletion state.
- **Lifecycle**:
  - `ngOnInit()`: Loads locations and sets navigation titles.
- **Core Methods**:
  - `loadLocations()`, `searchLocations()`: Fetches and filters locations.
  - `onEditLocation()`, `onDeleteClick()`, `onDeleteConfirm()`, `onDeleteCancel()`: Handles editing and deletion, enforcing campaign usage restrictions.
- **Error Handling**:
  - Uses `ToastrService` for user feedback.
- **UI**:
  - Locations table, add/edit/delete buttons, delete confirmation modal, and empty state.
  - Responsive layout and loading states.

---

## 4. SCSS and Spec Files
- SCSS files provide styling and animation for each component. No business logic.
- Spec files are for unit testing component creation. No business logic.

---

## 5. Service and Data Structure Uncertainty
If any service method or data structure is unclear, a log statement must be inserted in the relevant file. The user must run the code and provide the following log output:
- The full output of the log statement(s) inserted.
- The context in which the log was triggered (e.g., which action or user flow).

---

## End of Location Module Documentation 