# Notification Model Documentation (`Notification.ts`)

## Overview
Defines the Mongoose schema and model for notifications. Handles notification data structure, validation, and timestamp management.

---

## 1. Schema Definition
- Fields: recipient, type, title, message, link, data, read, readAt.
- Field validation: required fields, type checks, enum constraints for type, default values.

---

## 2. Indexes
- No explicit indexes defined beyond Mongoose defaults.

---

## 3. Model Export
- Exports the Notification model for use in other modules.

---

## Notes
- For any unclear schema or model logic, insert a log statement and instruct the user to provide:
  - The full object or value returned by the schema or model.
  - The values of any relevant variables at the point of logging.

---

# End of Notification Model Documentation 