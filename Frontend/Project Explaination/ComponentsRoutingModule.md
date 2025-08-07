# Components Routing Module Documentation

## Overview
The `components-routing.module.ts` file defines the routing configuration for the main application components. It sets up route paths, guards, role-based access, and data resolvers for both admin and user flows. The routing module ensures that only authorized users can access specific routes and that required data is resolved before route activation.

---

## Routing Structure
- The root path ('') is protected by the `AuthGuard` and uses the `PermissionsResolver` to resolve permissions before activating child routes.
- Child routes are grouped by feature (settings, admin, chat, locations, campaigns, subscriptions, invoices, profile, users, reviews, etc.).
- Each route specifies the component to render and, where necessary, applies additional guards and role-based access control.

### Admin Routes
- `settings/roles`, `settings/subscriptions`, `admin`, `chat-admin`, `available-locations`, `admin-subscriptions`, `customer-campaigns`, `admin-campaign-details/:id`, `users`, `admin-reviews` are all restricted to users with the 'admin' role via the `RoleGuard`.

### User Routes
- `subscriptions`, `subscriptions/:session_id`, `invoices`, `location`, `addlocation`, `edit-location/:id`, `campaigns`, `create-campaign`, `update-campaign/:id`, `campaign-details/:id`, `chat`, `reviews`, `add-review`, `edit-review/:id` are restricted to users with the 'user' role via the `RoleGuard`.
- The default child route ('') renders the `UserDashboardComponent` for users with the 'user' role.

### Shared Routes
- The `profile` route is accessible to any authenticated user.

---

## Guards and Resolvers
- `AuthGuard`: Ensures the user is authenticated before accessing any child routes.
- `RoleGuard`: Restricts access to routes based on user roles ('admin' or 'user').
- `PermissionsResolver`: Resolves user permissions before activating the main route tree.

---

## Data and Route Parameters
- Some routes use dynamic parameters (e.g., `admin-campaign-details/:id`, `edit-location/:id`, `edit-review/:id`, `campaign-details/:id`, `update-campaign/:id`, `subscriptions/:session_id`).
- The `data` property on routes specifies required roles for access control.

---

## Notes
- All route guards and resolvers are imported from the shared module.
- The routing module is imported into the main `ComponentsModule`.
- For any unclear guard or resolver logic, a log statement should be inserted in the relevant file and the user should provide the following log output:
  - The full object or value returned by the guard or resolver.
  - The values of any relevant variables at the point of logging.

---

# End of Components Routing Module Documentation 