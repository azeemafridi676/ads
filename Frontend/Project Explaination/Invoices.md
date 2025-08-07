# Invoices Component Documentation

## Overview
The Invoices component provides an overview and management interface for user invoices. It displays invoice data in a table, handles loading and empty states, and formats invoice duration for display. The component interacts with a subscriptions service to fetch invoice data.

---

## 1. `invoices.component.ts`

### Purpose
Handles the logic for fetching and displaying invoices. Manages loading state, error handling, and formatting of invoice duration.

### Logic
- **State Management**:
  - `invoices`: Holds the list of invoices fetched from the backend.
  - `isLoading`: Boolean indicating loading state for UI feedback.

- **Lifecycle**:
  - `ngOnInit()`: Fetches all invoices and sets navigation titles.

- **Core Methods**:
  - `getAllInvoices()`: Calls the subscriptions service to fetch invoices. Updates the `invoices` array and loading state.
  - `formatDuration(days: number)`: Utility to format a duration in days into a human-readable string (days, weeks, months, years).

- **Error Handling**:
  - Uses `ToastrService` to display error messages for failed operations.

---

## 2. `invoices.component.html`

### Purpose
Defines the UI for displaying invoices, including loading skeleton, empty state, and the invoices table.

### Logic
- **Loading State**: Shows a skeleton loader while invoices are being fetched.
- **Empty State**: Displays a message if there are no invoices.
- **Invoices Table**: Displays invoice details, including user info, plan info, amount, status, limits, and duration. Uses the `formatDuration` method for duration display.
- **Responsive Layout**: Uses Tailwind CSS classes for layout and styling.

---

## 3. `invoices.component.scss`
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

## End of Invoices Component Documentation 