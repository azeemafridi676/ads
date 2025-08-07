# Settings / Roles Component Documentation

## Overview
The Roles component under Settings manages user roles and their permissions. It allows administrators to view, create, and update roles, as well as modify permissions for each role. The component uses Angular Reactive Forms, modal animations, and interacts with a roles service for backend communication.

---

## 1. `roles.component.ts`

### Purpose
Handles the logic for displaying, creating, and updating roles and their permissions. Manages modal visibility, form state, and communicates with the backend via the `RolesService`.

### Logic
- **State Management**:
  - `roles`: Array holding the current list of roles.
  - `selectedId`: Tracks the currently selected role for permission editing.
  - `updatedRoles`: Object mapping role IDs to their permissions for tracking changes.
  - `isVisible`: Controls the visibility of the create role modal.
  - `roleForm`: Reactive form for creating a new role.
  - `loading`: Boolean indicating loading state for UI feedback.

- **Lifecycle**:
  - `ngOnInit()`: Loads roles from the backend on component initialization.

- **Core Methods**:
  - `loadRoles()`: Fetches the list of roles and their permissions from the backend.
  - `selectRole(id)`: Selects or deselects a role for permission editing.
  - `initializeUpdatedRoles()`: Initializes the `updatedRoles` object for tracking permission changes.
  - `updatePermission(roleId, resourceId, action, event)`: Updates the permission state for a given role and resource.
  - `applyChanges()`: Submits all updated permissions to the backend.
  - `openModal()`, `closeModal()`: Manage create role modal visibility.
  - `onSubmit()`: Submits a new role to the backend.

- **Error Handling**:
  - Uses `ToastrService` to display error messages for failed operations.

---

## 2. `roles.component.html`

### Purpose
Defines the UI for managing roles and permissions, including the roles list, permission checkboxes, and create role modal.

### Logic
- **Roles List**: Displays each role with an accordion for permissions.
- **Permissions Editing**: Checkboxes for view, add, edit, and delete actions per resource.
- **Apply Changes Button**: Submits all permission changes.
- **Create Role Modal**: Form for entering role name and description. Save and cancel buttons.
- **Responsive Layout**: Uses Tailwind CSS classes for layout and styling.

---

## 3. `roles.component.scss`
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

## End of Settings / Roles Component Documentation 