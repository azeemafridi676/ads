# Dashboard Controller Documentation (`dashboardController.ts`)

## Overview
Implements all business logic for dashboard-related API endpoints. Handles user and admin dashboard data aggregation, statistics, growth calculations, and chart data preparation. Integrates with models for campaigns, locations, users, invoices, and subscriptions.

---

## 1. User Dashboard Data
- `getUserDashboardData`: Aggregates and returns user-specific dashboard data, including:
  - Current and previous month campaign/location/view stats
  - Growth calculations for campaigns, locations, and views
  - Active campaigns, locations, and total views
  - Current plan usage and days remaining
  - Recent campaigns and performance chart data
  - Location distribution by state
- Uses MongoDB aggregation pipelines and model queries for data retrieval.
- Formats response for frontend dashboard consumption.

---

## 2. Admin Dashboard Data
- `getAdminDashboardData`: Aggregates and returns admin-wide dashboard data, including:
  - Total users, campaigns, locations, views, and revenue
  - Current and previous month revenue, user, and campaign stats
  - Growth calculations for users, revenue, and campaigns
  - Subscription distribution and recent users with active subscriptions
  - Monthly revenue chart data for the last 6 months
- Uses MongoDB aggregation pipelines and model queries for data retrieval.
- Formats response for frontend admin dashboard consumption.

---

## 3. Helper Functions
- `calculateUsagePercentage`: Calculates plan usage as a percentage.
- `calculateDaysRemaining`: Calculates days remaining in the current subscription.
- `calculateGrowth`: Calculates growth percentage and trend (up/down) between periods.

---

## Error Handling
- All controller functions handle errors and return appropriate HTTP status codes and messages.

---

## Notes
- Integrates with Campaign, Location, User, Invoice, and Subscription models.
- For any unclear aggregation, model, or helper logic, insert a log statement and instruct the user to provide:
  - The full object or value returned by the aggregation, model, or helper.
  - The values of any relevant variables at the point of logging.

---

# End of Dashboard Controller Documentation 