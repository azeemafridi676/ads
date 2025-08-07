# Location Router Documentation (`locationRouter.ts`)

## Overview
Defines the Express router for all location-related API endpoints. Handles route registration, authentication middleware, and controller integration for available states and location CRUD.

---

## 1. Route Definitions
- `GET /get-all-locations`: Authenticated user fetches all their locations.
- `GET /get-by-id/:id`: Authenticated user fetches a location by ID.
- `POST /add`: Authenticated user adds a new location.
- `PUT /update/:id`: Authenticated user updates a location by ID.
- `DELETE /delete/:id`: Authenticated user deletes a location by ID.
- `POST /add-available-states`: Authenticated user adds available states.
- `DELETE /delete-available-state/:id`: Authenticated user deletes an available state by ID.
- `GET /get-available-states`: Authenticated user fetches all available states.
- `GET /get-locations-with-campaign-status`: Authenticated user fetches all locations with campaign status flag.

---

## 2. Middleware Usage
- Uses `authMiddleware` to protect all routes.

---

## 3. Controller Integration
- Each route delegates business logic to the corresponding controller function.

---

## Notes
- For any unclear middleware or controller logic, insert a log statement and instruct the user to provide:
  - The full object or value returned by the middleware or controller.
  - The values of any relevant variables at the point of logging.

---

# End of Location Router Documentation 