# File Upload Service Documentation (`fileUploadService.ts`)

## Overview
Implements file upload logic to AWS S3 for user profile images and other files. Integrates with Multer for file handling and AWS SDK for S3 uploads.

---

## 1. S3 Upload Logic
- `uploadFileToS3`: Uploads a file to the configured S3 bucket under the `profiles/` directory.
  - Accepts an Express Multer file object.
  - Sets S3 parameters (bucket, key, body, content type).
  - Returns the uploaded file's S3 URL.

---

## Error Handling
- Handles and logs errors during S3 upload.
- Throws error if upload fails.

---

## Notes
- Integrates with Multer for file handling and AWS SDK for S3 uploads.
- For any unclear S3 or file logic, insert a log statement and instruct the user to provide:
  - The full object or value returned by the S3 upload operation.
  - The values of any relevant variables at the point of logging.

---

# End of File Upload Service Documentation 