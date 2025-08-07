# User Model Documentation (`userModel.ts`)

## Overview
Defines the Mongoose schema and model for users. Handles user data structure, validation, timestamp management, and super admin seeding.

---

## 1. Schema Definition
- Fields: firstName, lastName, phoneNumber, email, password, role, otp, profileImage, resetToken, resetTokenExpiry, verificationId, Dob, stripeCustomerId, status, currentSubscription, subscriptionStatus, subscriptionStartDate, subscriptionEndDate, isGiftedSubscription, giftedBy, giftedAt, isBanned, banReason, bannedAt, bannedBy.
- Field validation: type checks, enum constraints, default values.

---

## 2. Plugins
- Integrates a custom timestamp plugin to add createdAt and updatedAt fields.

---

## 3. Model Export
- Exports the User model for use in other modules.

---

## 4. Super Admin Seeding
- Seeds a default super admin user if none exists.

---

## Notes
- For any unclear schema, plugin, or model logic, insert a log statement and instruct the user to provide:
  - The full object or value returned by the schema, plugin, or model.
  - The values of any relevant variables at the point of logging.

---

# End of User Model Documentation 