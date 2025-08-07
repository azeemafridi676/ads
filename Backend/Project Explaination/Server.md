# Server File Documentation (`server.ts`)

## Overview
The `server.ts` file is the main entry point for the backend Node.js server. It sets up the Express application, configures middleware, registers API routes, initializes sockets, handles logging, and starts the HTTP server. It also ensures that required services (such as email transport) are initialized at startup.

---

## 1. Imports and Initial Setup
- Imports core modules (express, cors, multer, http, dotenv, fs, path).
- Imports database connection to ensure DB is connected before handling requests.
- Imports all route modules (user, subscriptions, location, campaign, driver, notification, chat, dashboard, reviews).
- Imports and initializes Passport for authentication (without session).
- Imports socket and email configuration utilities.

---

## 2. Express App and Middleware
- Creates an Express app instance.
- Custom middleware to handle Stripe webhook requests (bypasses JSON parsing for the webhook endpoint).
- Applies CORS middleware for cross-origin requests.
- Loads environment variables using dotenv.
- Logs every endpoint hit for debugging and monitoring.
- Initializes Passport authentication middleware.

---

## 3. Route Registration
- Registers all API routers under `/api/` prefixes for user, subscriptions, location, campaign, chat, driver (electron), notifications, dashboard, and reviews.
- Defines a basic root route (`/`) to confirm server status.

---

## 4. HTTP Server and Socket Initialization
- Sets the server port from environment or defaults to 3000.
- Creates an HTTP server from the Express app.
- Initializes socket.io using a custom `initializeSocket` function.

---

## 5. Logging Infrastructure
- Ensures the `debugging-logs/frontend-logs` directory exists for log storage.
- Defines a POST endpoint `/api/logs` to append log messages to a file (`logs.txt`).
- Handles file write errors and responds with appropriate status codes.

---

## 6. Service Initialization
- Defines an async `initializeServices` function to initialize the email transporter at startup.
- If initialization fails, logs the error and exits the process.

---

## 7. Server Startup
- Starts the HTTP server and listens on the configured port.
- Calls `initializeServices` after the server starts.
- Logs server status to the console.

---

## Notes
- All route logic is modularized and imported from separate files.
- Socket and email service initialization are abstracted into their own modules.
- For any unclear service, route, or socket logic, a log statement should be inserted in the relevant file and the user should provide the following log output:
  - The full object or value returned by the service, route handler, or socket event.
  - The values of any relevant variables at the point of logging.

---

# End of Server File Documentation 