# Available Locations Component Documentation

## Overview
The Available Locations component manages the list of US states available for location-based features in the application. It allows users to view, add, and delete states. The component uses Angular Reactive Forms, animations, and interacts with a location service for backend communication.

---

## 1. `available-locations.component.ts`

### Purpose
Handles the logic for displaying, adding, and deleting available states. Manages modal visibility, form state, and communicates with the backend via the `LocationService`.

### Logic
- **State Management**:
  - `states`: Array holding the current list of available states.
  - `loading`: Boolean indicating loading state for UI feedback.
  - `showAddStateModal`: Controls the visibility of the add state modal.
  - `usStatesList`: Static list of all US states and their codes.
  - `stateForm`: Reactive form for selecting states to add.
  - `selectedStates`: Array of states selected for addition.

- **Lifecycle**:
  - `ngOnInit()`: Fetches the current states from the backend and sets navigation titles.

- **Core Methods**:
  - `getStates()`: Fetches the list of available states from the backend.
  - `addState()`: Adds selected states to the backend and refreshes the list.
  - `deleteState(state)`: Deletes a state from the backend and refreshes the list.
  - `onStateSelect(event)`: Handles selection of a state from the dropdown.
  - `removeState(state)`: Removes a state from the selection list.
  - `searchStates(event)`: Filters the displayed states based on a search term.

- **Error Handling**:
  - Uses `ToastrService` to display error messages for failed operations.

- **Animations**:
  - Uses Angular animations for modal transitions.

---

## 2. `available-locations.component.html`

### Purpose
Defines the UI for managing available states, including the list, add modal, and loading states.

### Logic
- **Loading State**: Shows a spinner while data is loading.
- **No States Message**: Displays a message and button if no states are available.
- **States List**: Displays each state in a card with a delete button.
- **Add State Modal**:
  - Dropdown to select states from the US states list.
  - Preview of selected states with option to remove.
  - Add and cancel buttons.
- **Responsive Layout**: Uses Tailwind CSS classes for layout and styling.

---

## 3. `available-locations.component.scss`
- Contains component-specific styles. No business logic.

---

## 4. Spec File
- Contains unit tests for component creation. No business logic.

---

## 5. Service and Data Structure Uncertainty
If any service method or data structure is unclear, a log statement must be inserted in the relevant file. The user must run the code and provide the following log output:
- The full output of the log statement(s) inserted.
- The context in which the log was triggered (e.g., which action or user flow).

---

## End of Available Locations Component Documentation 