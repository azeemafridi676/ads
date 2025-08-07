# Components Module Documentation

## Overview
The `components.module.ts` file defines the main feature module for the application's core components. It organizes and declares all major UI components, imports shared and third-party modules, and sets up routing for the feature set.

---

## Module Structure
- Declares all major components for authentication, dashboard, settings, profile, subscriptions, invoices, locations, campaigns, chat, reviews, and website pages.
- Integrates modal, navigation, and utility components from the shared module.

---

## Imports
- `CommonModule`: Provides common Angular directives and pipes.
- `ComponentsRoutingModule`: Registers the routing configuration for all declared components.
- `SharedModule`: Imports shared components, services, and utilities used across the feature set.
- `FormsModule` and `ReactiveFormsModule`: Enable template-driven and reactive forms.
- `NgbPagination`, `NgbHighlight`: UI components from ng-bootstrap for pagination and highlighting.
- `NgxDropzoneModule`: Enables drag-and-drop file uploads.
- `CKEditorModule`: Integrates CKEditor for rich text editing.
- `GoogleMapsModule`: Integrates Google Maps for geospatial features.

---

## Declarations
- Lists all components managed by this module, including authentication, dashboard, settings, subscriptions, invoices, locations, campaigns, chat, reviews, and website components.
- Ensures all components are available for routing and template usage within the module.

---

## Integration
- The module is designed to be imported into the main application module, providing a cohesive set of features and UI elements.
- All shared and third-party modules are imported to ensure feature completeness and UI consistency.

---

## Notes
- For any unclear import, service, or component logic, a log statement should be inserted in the relevant file and the user should provide the following log output:
  - The full object or value returned by the import, service, or component.
  - The values of any relevant variables at the point of logging.

---

# End of Components Module Documentation 