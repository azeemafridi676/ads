import { Component, OnInit, ViewChild, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapsModule, GoogleMap } from '@angular/google-maps';
import { environment } from '../../environments/environment.development';
import { NavbarComponent } from '../shared/components/navbar/navbar.component';
import { ElectronService } from '../shared/services/electron/electron.service';
import { Router } from '@angular/router';
import { CampaignService } from '../shared/services/campaigns/campaign.service';
import { Campaign } from '../shared/interfaces';
import { LoggingService } from '../shared/services/logging.service';
import { Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';

// Define interfaces for Routes API
interface RoutesService {
  route(request: RoutesRequest): Promise<RoutesResponse>;
}

interface RoutesRequest {
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
  intermediates?: Array<{ location: google.maps.LatLngLiteral }>;
  travelMode?: google.maps.TravelMode;
  optimizeWaypoints?: boolean;
  computeAlternativeRoutes?: boolean;
  languageCode?: string;
  units?: google.maps.UnitSystem;
}

interface RoutesResponse {
  routes: Route[];
}

interface Route {
  polyline?: {
    encodedPolyline: string;
  };
}

@Component({
  selector: 'app-map-preview-page',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule, NavbarComponent],
  templateUrl: './map-preview-page.component.html',
  styleUrls: ['./map-preview-page.component.css']
})
export class MapPreviewPageComponent implements OnInit, OnDestroy {
  @ViewChild(GoogleMap) googleMap!: GoogleMap;
  
  isGoogleMapsLoaded = false;
  showBackButton = true;
  markers: google.maps.Marker[] = [];
  infoWindows: google.maps.InfoWindow[] = [];
  currentLocationMarker: google.maps.Marker | null = null;
  private locationSubscription: Subscription | null = null;
  private readonly SOURCE_FILE = 'map-preview-page.component.ts';
  private isRouteCalculated = false;
  
  mapOptions: google.maps.MapOptions = {
    center: { lat: 33.6615, lng: 73.0635 },
    zoom: 12,
    mapTypeId: 'roadmap',
    disableDefaultUI: true,
    draggableCursor: 'grab',
    draggingCursor: 'grabbing',
    gestureHandling: 'greedy',
    styles: [
      {
        featureType: 'all',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#eb7641' }]
      }
    ]
  };

  private routesService: google.maps.DirectionsService | null = null;
  private currentPolyline: google.maps.Polyline | null = null;

  constructor(
    private electronService: ElectronService,
    private router: Router,
    private campaignService: CampaignService,
    private loggingService: LoggingService,
    private ngZone: NgZone,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.loadGoogleMaps().then(() => {
      this.isGoogleMapsLoaded = true;
      
      setTimeout(() => {
        if (this.googleMap?.googleMap) {
          try {
            // Initialize DirectionsService for routing
            this.routesService = new google.maps.DirectionsService();
            this.loadCampaignLocations();
            this.startLocationUpdates();
          } catch (error) {
            this.loggingService.log(this.SOURCE_FILE, 'Error initializing services', error);
          }
        } else {
          this.loggingService.log(this.SOURCE_FILE, 'Google Map instance not found');
        }
      }, 1000);
    }).catch(error => {
      this.loggingService.log(this.SOURCE_FILE, 'Error loading Google Maps', error);
    });
  }

  ngOnDestroy() {
    if (this.locationSubscription) {
      this.locationSubscription.unsubscribe();
    }
  }

  private startLocationUpdates() {
    this.locationSubscription = this.electronService.onLocationUpdate()
      .subscribe(
        (update: any) => {
          this.ngZone.run(() => {
            this.updateCurrentLocation(update);
            if (!this.isRouteCalculated) {
              this.updateOptimalRoute();
              this.isRouteCalculated = true;
            }
          });
        }
      );
  }

  private updateCurrentLocation(location: any) {
    if (!this.googleMap?.googleMap) return;

    const position = {
      lat: location.latitude,
      lng: location.longitude
    };

    if (!this.currentLocationMarker) {
      // Create the current location marker with a custom pulse effect
      this.currentLocationMarker = new google.maps.Marker({
        position: position,
        map: this.googleMap.googleMap,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#4285F4', // Google Maps blue color
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        },
        title: 'Current Location',
        zIndex: 999 // Keep current location marker on top
      });

      // Add pulse effect
      const pulseEffect = () => {
        const icon = this.currentLocationMarker?.getIcon() as google.maps.Symbol;
        if (icon) {
          icon.scale = icon.scale === 10 ? 12 : 10;
          icon.fillOpacity = icon.scale === 10 ? 1 : 0.7;
          this.currentLocationMarker?.setIcon(icon);
        }
        setTimeout(pulseEffect, 1000);
      };
      pulseEffect();
    } else {
      this.currentLocationMarker.setPosition(position);
    }
  }

  private async updateOptimalRoute() {
    if (!this.currentLocationMarker || !this.markers.length || !this.googleMap?.googleMap) {
      return;
    }

    // Clear existing route
    if (this.currentPolyline) {
      this.currentPolyline.setMap(null);
    }

    const currentPos = this.currentLocationMarker.getPosition()!;
    const locations = this.markers.map(marker => marker.getPosition()!);

    // Find optimal route using circular repeating route pattern
    const route = await this.calculateOptimalRoute(currentPos, locations);

    if (route && route.length > 1) {
      try {
        // Prepare Routes API request
        const routesRequest = {
          origin: {
            location: {
              latLng: { latitude: route[0].lat(), longitude: route[0].lng() }
            }
          },
          destination: {
            location: {
              latLng: { latitude: route[route.length - 1].lat(), longitude: route[route.length - 1].lng() }
            }
          },
          intermediates: route.slice(1, -1).map(point => ({
            location: {
              latLng: { latitude: point.lat(), longitude: point.lng() }
            }
          })),
          travelMode: 'DRIVE',
          optimizeWaypointOrder: true,
          routingPreference: 'TRAFFIC_AWARE',
          languageCode: 'en',
          units: 'METRIC'
        };

        // Make HTTP request to Routes API
        const response = await this.http.post<any>(
          'https://routes.googleapis.com/directions/v2:computeRoutes',
          routesRequest,
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': environment.googleMapsApiKey,
              'X-Goog-FieldMask': 'routes.polyline.encodedPolyline,routes.optimizedIntermediateWaypointIndex'
            }
          }
        ).toPromise();

        if (response?.routes?.length > 0) {
          const encodedPolyline = response.routes[0].polyline.encodedPolyline;
          const path = google.maps.geometry.encoding.decodePath(encodedPolyline);

          // Create a new polyline
          this.currentPolyline = new google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: '#4285F4', // Google Maps blue color
            strokeOpacity: 1,
            strokeWeight: 6,
            map: this.googleMap!.googleMap!,
            zIndex: 1 // Keep route below markers but above map
          });

          // Add a white outline to make the route stand out
          const outlinePolyline = new google.maps.Polyline({
            path: path,
            geodesic: true,
            strokeColor: '#FFFFFF',
            strokeOpacity: 1,
            strokeWeight: 8,
            map: this.googleMap!.googleMap!,
            zIndex: 0 // Keep outline below main route
          });

          // Fit bounds to show the entire route
          const bounds = new google.maps.LatLngBounds();
          path.forEach(point => bounds.extend(point));
          this.googleMap!.googleMap!.fitBounds(bounds);
        } else {
          this.drawSimpleRoute(route);
        }
      } catch (error) {
        this.loggingService.log(this.SOURCE_FILE, 'Error in Routes API request, falling back to simple route', { error });
        this.drawSimpleRoute(route);
      }
    } else {
      this.loggingService.log(this.SOURCE_FILE, 'No valid route calculated', { routeLength: route?.length });
    }
  }

  private drawSimpleRoute(route: google.maps.LatLng[]) {
    // Clear any existing route
    if (this.currentPolyline) {
      this.currentPolyline.setMap(null);
    }

    // Create outline for the simple route
    const outlinePolyline = new google.maps.Polyline({
      path: route,
      geodesic: true,
      strokeColor: '#FFFFFF',
      strokeOpacity: 1,
      strokeWeight: 8,
      map: this.googleMap!.googleMap!,
      zIndex: 0
    });

    // Create a new polyline
    this.currentPolyline = new google.maps.Polyline({
      path: route,
      geodesic: true,
      strokeColor: '#4285F4',
      strokeOpacity: 1,
      strokeWeight: 6,
      map: this.googleMap!.googleMap!,
      zIndex: 1
    });
  }

  private async calculateOptimalRoute(
    start: google.maps.LatLng,
    destinations: google.maps.LatLng[]
  ): Promise<google.maps.LatLng[]> {
    // Create a circular repeating route
    const route: google.maps.LatLng[] = [start];
    const unvisited = [...destinations];

    // First, find the nearest point from start location
    let nearestIdx = 0;
    let minDistance = this.calculateDistance(
      start.lat(),
      start.lng(),
      unvisited[0].lat(),
      unvisited[0].lng()
    );

    for (let i = 1; i < unvisited.length; i++) {
      const distance = this.calculateDistance(
        start.lat(),
        start.lng(),
        unvisited[i].lat(),
        unvisited[i].lng()
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestIdx = i;
      }
    }

    // Create the initial route from nearest to furthest
    const orderedPoints = [unvisited[nearestIdx]];
    unvisited.splice(nearestIdx, 1);

    while (unvisited.length > 0) {
      const current = orderedPoints[orderedPoints.length - 1];
      nearestIdx = 0;
      minDistance = this.calculateDistance(
        current.lat(),
        current.lng(),
        unvisited[0].lat(),
        unvisited[0].lng()
      );

      for (let i = 1; i < unvisited.length; i++) {
        const distance = this.calculateDistance(
          current.lat(),
          current.lng(),
          unvisited[i].lat(),
          unvisited[i].lng()
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestIdx = i;
        }
      }

      orderedPoints.push(unvisited[nearestIdx]);
      unvisited.splice(nearestIdx, 1);
    }

    // Create the circular repeating route pattern
    // Pattern: start -> points -> start -> points -> start
    route.push(...orderedPoints); // First pass through points
    route.push(start); // Back to start
    route.push(...orderedPoints); // Second pass through points
    route.push(start); // Final return to start

    return route;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private async loadCampaignLocations() {
    try {
      const playableCampaigns = this.campaignService.getPlayableCampaigns();
      if (playableCampaigns.length === 0) {
        return;
      }
      if (!this.googleMap) {
        return;
      }

      const googleMap = this.googleMap.googleMap!;
      playableCampaigns.forEach(campaign => {
        campaign.selectedLocations.forEach(location => {
          const position = {
            lat: location.latitude,
            lng: location.longitude
          };

          // Create marker with custom styling
          const marker = new google.maps.Marker({
            position: position,
            map: googleMap,
            title: location.locationName,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 12,
              fillColor: '#eb7641',
              fillOpacity: 0.4,
              strokeColor: '#eb7641',
              strokeWeight: 2
            }
          });

          // Create styled info window
          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 15px; min-width: 200px;">
                <h3 style="color: #eb7641; margin-bottom: 8px; font-weight: 600;"><strong style="color: #374151;">Location:</strong> ${location.locationName}</h3>
                <p style="margin: 0; color: #4B5563; font-size: 14px;">
                  <strong style="color: #374151;">Campaign:</strong> ${campaign.campaignName}
                </p>
              </div>
            `
          });

          infoWindow.open(googleMap, marker);

          this.markers.push(marker);
          this.infoWindows.push(infoWindow);

          marker.addListener('click', () => {
            this.infoWindows.forEach(iw => iw.close());
            infoWindow.open(googleMap, marker);
          });
        });
      });

      if (this.markers.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        this.markers.forEach(marker => bounds.extend(marker.getPosition()!));
        googleMap.fitBounds(bounds);
      }
    } catch (error) {
      this.loggingService.log(this.SOURCE_FILE, 'Error loading campaign locations:', error);
    }
  }

  private loadGoogleMaps(): Promise<void> {
    return new Promise((resolve, reject) => {
      
      // Add logging for API key validation
      const apiKey = environment.googleMapsApiKey;
      
      if (window.google) {
        // Add logging for loaded APIs
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,places`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        // Log available services after load
        resolve();
      };
      
      script.onerror = (error) => {
        this.loggingService.log(this.SOURCE_FILE, 'Failed to load Google Maps script', {
          error,
          apiKeyPresent: !!apiKey,
          apiKeyLength: apiKey?.length || 0
        });
        reject(error);
      };

      document.head.appendChild(script);
    });
  }

  minimizeWindow() {
    this.electronService.minimizeWindow();
  }

  closeWindow() {
    this.electronService.closeWindow();
  }

  goToVideoPlayPage() {
    const playableCampaigns = this.campaignService.getPlayableCampaigns();
    if (playableCampaigns.length > 0) {
      this.router.navigate(['/app/video-play']);
    } else {
      const allCampaigns = this.campaignService.getDownloadedCampaigns();
      if (allCampaigns.length > 0) {
        this.router.navigate(['/app/video-play']);
      } else {
        alert('No campaigns are available to play.');
      }
    }
  }

  public recalculateRoute() {
    this.isRouteCalculated = false;
    this.updateOptimalRoute();
  }
}
