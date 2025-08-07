import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  private backendUrl = environment.BACKEND_URL;
  private readonly LOGGING_URL = `${this.backendUrl}/api/logs`;

  constructor(private http: HttpClient) {
  }

  log(source: string, message: string, data?: any) {
    // const logMessage = typeof message === 'object' ? JSON.stringify(message) : message;
    // let logEntry = `🔵[${source}] ${logMessage}`;
    // // Add data to log entry if present
    // if (data !== undefined && data !== null) {
    //   const dataString = typeof data === 'object' ? JSON.stringify(data) : data;
    //   logEntry += ` ${dataString}`;
    // }

    // this.http.post(this.LOGGING_URL, { message: logEntry }).subscribe(
    //   () => {
    //     console.log('Log sent to server');
    //   },
    //   (error: any) => {
    //     console.error(`Error sending log to server: ${error}`);
    //   }
    // );
  }
}