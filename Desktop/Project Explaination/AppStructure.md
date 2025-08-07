# Core Angular App Structure (Electron Desktop App)

This document explains the logic, structure, and flow of the core Angular files in the Electron desktop application. It covers:
- app-routing.module.ts
- app.component.css
- app.component.html
- app.component.spec.ts
- app.component.ts
- app.config.ts
- main.ts

---

## 1. app-routing.module.ts

- **Purpose:** Defines the main routing configuration for the Angular desktop app.
- **Structure:**
  - Uses Angular's `RouterModule.forRoot` with hash-based routing (`useHash: true`) and route tracing enabled for debugging (`enableTracing: true`).
  - Declares all routes for authentication, onboarding, campaign management, map, video playback, and the external display.
  - **Guards:**
    - `AuthGuard`: Protects all `/app` routes, ensuring only authenticated users can access them.
    - `PublicGuard`: Prevents authenticated users from accessing login/signup/forgot-password routes.
    - `ExternalWindowGuard`: Ensures the external display route is only accessible in the correct window context.
  - **Routes:**
    - `/external-display`: Loads the external display component for the van-mounted screen.
    - `/login`, `/signup`, `/forgot-password`, `/otp`, `/reset-password`: Public authentication routes.
    - `/app`: Protected parent route for all main app features (screen selector, connection, welcome, campaign download, map preview, video play).
    - Default and catch-all routes redirect to `/app/create-connection`.

---

## 2. app.component.ts

- **Purpose:** Root Angular component for the desktop app.
- **Template:** Contains only `<router-outlet>`, delegating all UI to routed components.
- **Logic:**
  - On initialization (`ngOnInit`):
    - Checks if running in the external window (via ElectronService). If so, skips further logic.
    - Checks for access and refresh tokens. If missing, navigates to `/login`.
    - Verifies tokens with AuthService. If valid, navigates to `/app/create-connection`; otherwise, redirects to `/login`.
    - Subscribes to router navigation events for potential logging or analytics.
- **Title:** Sets a default title for the app.

---

## 3. app.component.html / app.component.css

- **app.component.html:** Empty (all UI is routed).
- **app.component.css:** Empty (no global styles at the root component level).

---

## 4. app.component.spec.ts

- **Purpose:** Unit tests for the root component.
- **Tests:**
  - Component creation.
  - Title property value.
  - Rendering of a sample title in the template (for demonstration; actual template is empty in production).

---

## 5. app.config.ts

- **Purpose:** Provides the main application configuration for Angular's standalone bootstrap API.
- **Providers:**
  - `provideZoneChangeDetection`: Optimizes change detection.
  - `provideRouter`: Supplies the main route configuration.
  - `provideHttpClient` with interceptors (e.g., for authentication).
  - Registers all core services: CampaignService, ElectronService, AuthService, ElectronLogService.
- **Usage:** Used for advanced bootstrapping scenarios (not directly referenced in main.ts in this setup, but available for modular configuration).

---

## 6. main.ts

- **Purpose:** Entry point for bootstrapping the Angular application in the Electron environment.
- **Logic:**
  - Uses Angular's `bootstrapApplication` API to start the app with `AppComponent` as the root.
  - Registers global providers:
    - `provideHttpClient` for HTTP requests.
    - Imports `AppRoutingModule` for routing, `BrowserAnimationsModule` for animations, and `ToastrModule` for toast notifications.
    - Configures Toastr with default options (timeout, position, prevent duplicates).
  - Catches and alerts on bootstrap errors.
- **Electron-Specific:**
  - The app is designed to run in Electron, but the bootstrap logic is standard Angular and does not require Electron-specific code in this file.

---

## Integration and Lifecycle

- **Routing:** All navigation and UI rendering is handled via Angular's router, with guards enforcing authentication and window context.
- **Bootstrap:** The app is started via `main.ts`, which loads the root component and all providers.
- **Electron Integration:**
  - Electron-specific logic (window type detection, external display handling) is managed in services and guards, not in the root files.
  - The app can distinguish between main and external windows and adjust behavior accordingly.
- **Testing:** The root component is tested for creation and basic properties, but most logic is delegated to routed components and services.

---

This documentation covers the core structure and lifecycle of the Angular desktop app, showing how routing, bootstrapping, and root component logic are organized and how they support the overall Electron application. 