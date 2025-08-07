# Subscription Model Documentation (`subscriptionModel.ts`)

## Overview
Defines the Mongoose schema and model for subscription plans. Handles subscription data structure, validation, and timestamp management.

---

## 1. Schema Definition
- Fields: planName, description, duration, price, stripePlanId, planType, adCampaignTimeLimit, adVedioTimeLimit, campaignLimit, expiryDate, launchDate, locationLimit, priority, allowedRadius, runCycleLimit, currentCycles, isCompleted, completedAt, isVisible, testClockId.
- Field validation: required fields, type checks, enum constraints, default values.

---

## 2. Plugins
- Integrates a custom timestamp plugin to add createdAt and updatedAt fields.

---

## 3. Model Export
- Exports the Subscription model for use in other modules.

---

## Notes
- For any unclear schema, plugin, or model logic, insert a log statement and instruct the user to provide:
  - The full object or value returned by the schema, plugin, or model.
  - The values of any relevant variables at the point of logging.

---

# End of Subscription Model Documentation 