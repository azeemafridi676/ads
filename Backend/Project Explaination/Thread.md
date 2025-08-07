# Thread Model Documentation (`Thread.ts`)

## Overview
Defines the Mongoose schema and model for chat threads. Handles thread data structure, validation, and indexing for efficient queries.

---

## 1. Schema Definition
- Fields: userId, lastMessage, unreadCount, userStatus, category, priority, lastActivity.
- Field validation: required fields, type checks, enum constraints, default values.

---

## 2. Indexes
- Indexes on userId+createdAt, lastActivity+unreadCount, category+lastActivity, and userStatus for query performance.

---

## 3. Model Export
- Exports the Thread model for use in other modules.

---

## Notes
- For any unclear schema or index logic, insert a log statement and instruct the user to provide:
  - The full object or value returned by the schema or index.
  - The values of any relevant variables at the point of logging.

---

# End of Thread Model Documentation 