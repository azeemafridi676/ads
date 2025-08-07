export interface ApiResponse<T> {
    data?: T;         // `data` is optional and will hold the actual response data
    message?: string; // `message` is optional and will hold any status or error message
    status: number;   // `status` is a required field for HTTP status codes
  }
  