# Location Controller Documentation (`locationController.ts`)

## Overview
Implements all business logic for location-related API endpoints. Handles available states management, location CRUD, campaign status checks, and integration with user subscription limits. Integrates with Location, AvailableStates, and Campaign models.

---

## 1. Available States Management
- `addAvailableStates`: Adds multiple available states to the database.
- `deleteAvailableState`: Deletes an available state by ID.
- `getAvailableStates`: Retrieves all available states.

---

## 2. Location CRUD
- `addLocation`: Creates a new location for the authenticated user.
  - Validates against subscription radius and location limits.
- `getAllLocations`: Retrieves all locations for the authenticated user.
- `updateLocation`: Updates a location by ID, validates ownership and subscription radius.
- `deleteLocation`: Deletes a location by ID, validates ownership.
- `getLocationById`: Retrieves a location by ID, validates ownership.

---

## 3. Locations with Campaign Status
- `getLocationsWithCampaignStatus`: Retrieves all locations for the user, flags those used in approved campaigns.

---

## Error Handling
- All controller functions handle errors and return appropriate HTTP status codes and messages.

---

## Notes
- Integrates with Location, AvailableStates, and Campaign models.
- For any unclear model, validation, or business logic, insert a log statement and instruct the user to provide:
  - The full object or value returned by the model, validation, or business logic.
  - The values of any relevant variables at the point of logging.

---

# End of Location Controller Documentation 