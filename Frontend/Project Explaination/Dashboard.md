# Dashboard Module Documentation

## Overview
The Dashboard module provides analytics and summary views for both administrators and users. It includes components for the admin dashboard (platform-wide metrics, revenue, user growth, and active subscribers) and the user dashboard (personal campaign performance, plan status, and recent activity). The module integrates with dashboard, navigation, and subscription services.

---

## 1. `admin-dashboard` Component

### Purpose
Displays platform-wide statistics and analytics for administrators, including user count, revenue, campaign count, views, growth rates, and active subscribers. Renders charts for revenue and user growth.

### Logic
- **State Management**:
  - Metrics: `totalUsers`, `totalRevenue`, `totalCampaigns`, `totalViews`, `currentMonthRevenue`.
  - Growth rates: `userGrowthRate`, `revenueGrowthRate`, `campaignGrowthRate`, and corresponding month names.
  - Loading state: `isLoading`.
  - Chart instances: `revenueChart`, `userGrowthChart`.
  - Dashboard data: `dashboardData` (full response from backend).
- **Lifecycle**:
  - `ngOnInit()`: Loads dashboard data, sets navigation titles.
  - `ngAfterViewInit()`: Initializes charts after view is ready.
  - `ngOnDestroy()`: Destroys chart instances to free resources.
- **Core Methods**:
  - `loadDashboardData()`: Fetches dashboard data from backend and updates metrics.
  - `initializeCharts()`, `initRevenueChart()`, `initUserGrowthChart()`: Chart.js chart setup and rendering.
  - `getDaysRemaining()`: Utility for calculating days left in a subscription.
- **Error Handling**:
  - Uses console logging for errors.
- **UI**:
  - Stats cards, revenue/user growth charts, and active subscribers table.
  - Responsive layout and loading states.

---

## 2. `user-dashboard` Component

### Purpose
Displays personalized analytics for users, including active campaigns, locations, ad views, current plan, plan usage, and recent campaigns. Renders charts for campaign performance and location distribution.

### Logic
- **State Management**:
  - Metrics: `activeCampaigns`, `activeLocations`, `totalViews`, `currentPlan`, `planUsagePercentage`, `daysRemaining`.
  - Recent campaigns: `recentCampaigns`.
  - Loading state: `isLoading`.
  - Growth stats: `statsGrowth` (campaigns, locations, views).
- **Lifecycle**:
  - `ngOnInit()`: Loads dashboard data, sets navigation titles.
- **Core Methods**:
  - `loadDashboardData()`: Fetches dashboard data from backend and updates metrics.
  - `initializeCharts()`: Chart.js chart setup for campaign performance and location distribution.
  - Navigation methods: `onViewAllCampaigns()`, `onCreateCampaign()`, `onEditCampaign()`, `onViewCampaign()`.
- **Error Handling**:
  - Uses console logging for errors.
- **UI**:
  - Stats cards, campaign/location charts, recent campaigns table, and empty states.
  - Responsive layout and loading states.

---

## 3. SCSS and Spec Files
- SCSS files provide styling and animation for each component. No business logic.
- Spec files are for unit testing component creation. No business logic.

---

## 4. Service and Data Structure Uncertainty
If any service method or data structure is unclear, a log statement must be inserted in the relevant file. The user must run the code and provide the following log output:
- The full output of the log statement(s) inserted.
- The context in which the log was triggered (e.g., which action or user flow).

---

## End of Dashboard Module Documentation 