# Database Directory Documentation

## Overview
The `database` directory contains files for database connection and setup. These files establish the connection to MongoDB using environment variables and handle connection errors.

---

## 1. `connection.ts`
- **Purpose:** Connects to MongoDB using Mongoose.
- **Key Logic:**
  - Loads environment variables with dotenv.
  - Validates `MONGO_URI` is set.
  - Connects to MongoDB with connection options (timeouts, heartbeat).
  - Logs connection success or error details.
- **Integration:** Imported at server startup to ensure DB is connected before handling requests.

---

## Notes
- For any unclear connection or error logic, insert a log statement and instruct the user to provide:
  - The full object or value returned by the connection attempt.
  - The values of any relevant variables at the point of connection.

---

# End of Database Directory Documentation 