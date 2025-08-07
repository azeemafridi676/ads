import { Injectable } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Campaign } from "../../interfaces";
import { async, BehaviorSubject, catchError, from, map, Observable, throwError } from 'rxjs';
import moment from 'moment-timezone';
import { ElectronService } from "../electron/electron.service";
import { LoggingService } from "../logging.service";
import { AuthService } from '../Auth/Auth.service';

@Injectable({
  providedIn: "root",
})
export class CampaignService {
  private backendUrl = environment.BACKEND_URL;
  private selectedCampaigns: Campaign[] = [];
  private downloadedCampaigns: Campaign[] = [];
  private currentLocation: BehaviorSubject<{ latitude: number, longitude: number } | null> = new BehaviorSubject<{ latitude: number, longitude: number } | null>({ latitude: 0, longitude: 0 });
  private timezone: string;
  private readonly SOURCE = 'campaign.service.ts';
  private readonly apiUrl = `${this.backendUrl}/api/electron`;

  constructor(private http: HttpClient, private electronService: ElectronService, private loggingService: LoggingService, private authService: AuthService) {
    this.timezone = environment.TZ;
    if (!this.timezone) {
      console.log('No timezone found in environment');
    }
  }

  getCampaigns(): Observable<Campaign[]> {
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const timezone = this.timezone || 'America/Chicago';

    console.log('Using timezone:', timezone);

    return this.http.get<any>(`${this.backendUrl}/api/electron/get-compaigns-for-electron`, { headers }).pipe(
      map((response: any) => {
        if (response.status === 200) {
          return response.data;
        } else {
          throw new Error(response.message || 'Failed to fetch campaigns');
        }
      }),
      catchError(error => {
        this.loggingService.log('campaign.service.ts', 'Error in getCampaigns:', error);
        return throwError(() => error);
      })
    );
  }

  getCampaignsForScreen(): Observable<Campaign[]> {
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    return this.http.get<any>(`${this.backendUrl}/api/electron/get-compaigns-for-screen`, { headers }).pipe(
      map((response: any) => {
        if (response.status === 200) {
          return response.data;  // Return just the data array
        } else {
          throw new Error(response.message || 'Failed to fetch campaigns');
        }
      }),
      catchError(error => {
        this.loggingService.log('campaign.service.ts', 'Error in getCampaignsForScreen:', error);
        return throwError(() => error);
      })
    );
  }


  setSelectedCampaigns(campaigns: Campaign[]) {
    this.selectedCampaigns = campaigns;
  }

  getSelectedCampaigns(): Campaign[] {
    return this.selectedCampaigns;
  }

  setDownloadedCampaigns(campaigns: Campaign[]) {
    this.downloadedCampaigns = campaigns;
  }

  getDownloadedCampaigns(): Campaign[] {
    return this.downloadedCampaigns;
  }

  setCurrentLocation(location: { latitude: number, longitude: number }) {
    this.currentLocation.next(location);
  }

  getCurrentLocation(): Observable<{ latitude: number, longitude: number } | null> {
    return this.currentLocation.asObservable();
  }

  getPlayableCampaigns(): Campaign[] {
    const timezone = this.timezone || 'America/Chicago';
    const now = moment().tz(timezone);
    
   
    
    const playableCampaigns = this.downloadedCampaigns.filter(campaign => {
       
        
        // Parse campaign dates with explicit format in timezone
        const campaignStart = moment.tz(campaign.startDateTime, 'YYYY-MM-DD H:mm:ss z', timezone);
        const campaignEnd = moment.tz(campaign.endDateTime, 'YYYY-MM-DD H:mm:ss z', timezone);

        // Verify the dates are valid
        if (!campaignStart.isValid() || !campaignEnd.isValid()) {
          
          return false;
        }

       

        // Check date range
        const isWithinDateRange = now.isBetween(campaignStart, campaignEnd, 'minute', '[]');
        if (!isWithinDateRange) {
          
          return false;
        }

        // Time window check in the specified timezone
        const startTimeInMinutes = campaignStart.hours() * 60 + campaignStart.minutes();
        const endTimeInMinutes = campaignEnd.hours() * 60 + campaignEnd.minutes();
        const currentTimeInMinutes = now.hours() * 60 + now.minutes();

        const isWithinTimeWindow = currentTimeInMinutes >= startTimeInMinutes && 
                                 currentTimeInMinutes <= endTimeInMinutes;

        

        if (!isWithinTimeWindow) {
          
          return false;
        }

        

        return true;
    });

   

    return playableCampaigns;
  }

  getPlayableCampaignsForLocation(currentLat: number, currentLon: number): Campaign[] {
    const playableCampaigns = this.getPlayableCampaigns();
    return playableCampaigns.filter(campaign => {
        // Check if user is within radius of ANY campaign location
        const isWithinAnyLocation = campaign.selectedLocations.some(location => {
            const distance = this.calculateDistance(
                currentLat, 
                currentLon,
                location.latitude, 
                location.longitude
            );
            const radius = location.radius || 1; // Default to 1km if radius not specified
            return distance <= radius;
        });
        return isWithinAnyLocation;
    });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRadians = (degree: number) => degree * (Math.PI / 180);
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }
  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async updateCampaignDownloadStatus(campaignId: string, downloadedUrl: string): Promise<any> {
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    const url = `${this.apiUrl}/update-campaign-download`;
    return this.http.post(url, {
        campaignId,
        downloadedUrl
    }, { headers }).toPromise();
  }

  updateCampaignCycle(campaignId: string): Observable<any> {
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    return this.http.put<any>(
      `${this.backendUrl}/api/campaign/update-campaign-cycle/${campaignId}`, 
      {}, 
      { headers }
    ).pipe(
      map(response => {
        return response;
      }),
      catchError(error => {
        this.loggingService.log(
          this.SOURCE + ' : updateCampaignCycle',
          'Error updating campaign cycle:',
          error
        );
        return throwError(() => error);
      })
    );
  }

  updateCampaignCycleAndLocation(campaignId: string, location: { latitude: number; longitude: number }): Observable<any> {
    const token = this.authService.getAccessToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    
    return this.http.put<any>(
      `${this.backendUrl}/api/campaign/update-campaign-cycle-location/${campaignId}`, 
      location,
      { headers }
    ).pipe(
      map(response => {
        return response;
      }),
      catchError(error => {
        this.loggingService.log(
          this.SOURCE + ' : updateCampaignCycleAndLocation',
          'Error updating campaign cycle and location:',
          error
        );
        return throwError(() => error);
      })
    );
  }
}
