import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LocationService } from 'src/app/shared/service/location/location.service';
import { GoogleMap, MapCircle, MapMarker } from '@angular/google-maps';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/shared/service/Auth/Auth.service';
import { UpgradeNotificationService } from 'src/app/shared/service/upgrade-notifiication/upgrade-notificatiion.service';
import { Router, ActivatedRoute } from '@angular/router';
import { NavService } from 'src/app/shared/service/navbar/nav.service';

@Component({
  selector: 'app-edit-location',
  templateUrl: './edit-location.component.html',
  styleUrls: ['./edit-location.component.scss']
})
export class EditLocationComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(GoogleMap) map!: GoogleMap;
  @ViewChild(MapMarker) marker!: MapMarker;
  
  locationId: string = '';
  apiLoaded: boolean = false;
  currentStep = 1;
  editLocationForm: FormGroup;
  loading = false;
  states: any[] = [];
  selectedState: any = null;
  currentSubscription: any;

  // Map properties
  mapOptions: google.maps.MapOptions = {
    zoom: 8,
    mapTypeId: 'roadmap',
    streetViewControl: false,
    mapTypeControl: false,
    zoomControl: true,
    scaleControl: true,
    rotateControl: false,
    fullscreenControl: false,
    styles: [
      {
        featureType: "administrative",
        elementType: "geometry.stroke",
        stylers: [{ visibility: "off" }]
      },
      {
        featureType: "administrative.land_parcel",
        stylers: [{ visibility: "off" }]
      },
      {
        featureType: "administrative.neighborhood",
        stylers: [{ visibility: "off" }]
      }
    ]
  };
  
  center: google.maps.LatLngLiteral = {
    lat: 37.0902,
    lng: -95.7129
  };

  markerPosition: google.maps.LatLngLiteral | null = null;
  circleOptions: google.maps.CircleOptions = {
    fillColor: '#eb7641',
    fillOpacity: 0.3,
    strokeColor: '#eb7641',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    editable: true,
    radius: 200,
  };

  selectedLocation: any = null;
  stateBounds: google.maps.LatLngBounds | null = null;
  radiusValue: number = 200;
  maxRadius: number = 500;
  minRadius: number = 100;
  attemptedRadius: number = 0;

  private circleInstance: google.maps.Circle | null = null;

  constructor(
    private fb: FormBuilder,
    private locationService: LocationService,
    private toastr: ToastrService,
    private authService: AuthService,
    private upgradeNotificationService: UpgradeNotificationService,
    public router: Router,
    private route: ActivatedRoute,
    private navService: NavService
  ) {
    this.editLocationForm = this.fb.group({
      locationName: ['', [Validators.required, Validators.minLength(5)]],
      country: ['US', Validators.required],
      state: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.locationId = this.route.snapshot.params['id'];
    this.fetchStates();
    this.loadLocationData();
    this.authService.getUserDetails().subscribe((user) => {
      this.currentSubscription = user.currentSubscription;
      this.maxRadius = this.currentSubscription.allowedRadius;
    });
    this.navService.setTitle('Edit Location');
    this.navService.setSubtitle('Modify your advertising location details');
  }

  ngAfterViewInit() {
    // Wait for the map to be available
    setTimeout(() => {
      if (this.map?.googleMap) {
        this.initializeMapForState();
      }
    }, 1000);
  }

  loadLocationData() {
    this.loading = true;
    this.locationService.getLocationById(this.locationId).subscribe({
      next: (response: any) => {
        const location = response.data;
        this.editLocationForm.patchValue({
          locationName: location.locationName,
          state: location.state
        });
        this.selectedState = location.state;
        this.markerPosition = {
          lat: location.latitude,
          lng: location.longitude
        };
        this.selectedLocation = {
          lat: location.latitude,
          lng: location.longitude,
          radius: location.radius
        };
        this.radiusValue = location.radius;
        this.circleOptions = {
          ...this.circleOptions,
          radius: location.radius
        };

        // Initialize circle if map is ready
        if (this.map?.googleMap && this.markerPosition) {
          this.updateCircleRadius(location.radius);
        }
        
        this.loading = false;
        
        if (this.currentStep === 2) {
          this.initializeMapForState();
        }
      },
      error: (error: any) => {
        console.error('Error loading location:', error);
        this.toastr.error('Error loading location details');
        this.loading = false;
      }
    });
  }

  onStateChange(event: any) {
    const stateCode = event.target.value;
    this.selectedState = stateCode;
    if (this.currentStep === 2) {
      this.initializeMapForState();
    }
  }

  fetchStates() {
    this.loading = true;
    this.locationService.getStates().subscribe({
      next: (response: any) => {
        this.states = response;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching states:', error);
        this.loading = false;
      }
    });
  }

  nextStep() {
    if (this.editLocationForm.valid) {
      this.currentStep++;
      if (this.currentStep === 2) {
        setTimeout(() => {
          if (!this.map?.googleMap) {
            setTimeout(() => {
              this.initializeMapForState();
            }, 1000);
          } else {
            this.initializeMapForState();
          }
        }, 100);
      }
    }
  }

  async initializeMapForState() {
    if (!this.map?.googleMap) return;

    try {
      // If we have an existing location, center on that
      if (this.markerPosition) {
        this.center = this.markerPosition;
        this.map.googleMap.setCenter(this.markerPosition);
        this.map.googleMap.setZoom(15); // Closer zoom for existing location
        return;
      }

      // Otherwise, center on the selected state
      if (this.selectedState) {
        const geocoder = new google.maps.Geocoder();
        
        await new Promise((resolve, reject) => {
          geocoder.geocode(
            { address: `${this.selectedState}, USA` },
            (results, status) => {
              if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
                const place = results[0];
                if (place.geometry?.viewport) {
                  this.map?.googleMap?.fitBounds(place.geometry.viewport);
                  
                  // Set a reasonable zoom level for state view
                  setTimeout(() => {
                    if (this.map?.googleMap) {
                      const zoom = this.map.googleMap.getZoom() || 0;
                      this.map.googleMap.setZoom(Math.min(zoom, 8));
                    }
                  }, 100);

                  const center = place.geometry.viewport.getCenter();
                  this.center = {
                    lat: center.lat(),
                    lng: center.lng()
                  };
                  resolve(true);
                } else {
                  reject(new Error('No viewport found'));
                }
              } else {
                reject(new Error(`Geocoding error: ${status}`));
              }
            }
          );
        });
      }
    } catch (error) {
      console.error('Error:', error);
      this.toastr.error('Error loading map location. Please try again.');
    }
  }

  onMapClick(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      if (this.isWithinStateBounds(event.latLng)) {
        this.markerPosition = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        };
        this.selectedLocation = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng(),
          radius: this.circleOptions.radius
        };

        // Update circle position
        if (this.circleInstance) {
          this.circleInstance.setCenter(this.markerPosition);
        } else {
          this.updateCircleRadius(this.radiusValue);
        }
      } else {
        this.toastr.warning('Please select a location within the state boundaries');
      }
    }
  }

  private isWithinStateBounds(latLng: google.maps.LatLng): boolean {
    if (this.map?.googleMap) {
      const bounds = this.map.googleMap.getBounds();
      return bounds ? bounds.contains(latLng) : true;
    }
    return true;
  }

  onSubmit() {
    if (!this.currentSubscription) {
      this.showSubscriptionRequiredNotification();
      return;
    }

    if (this.radiusValue > this.maxRadius) {
      this.showRadiusLimitNotification();
      return;
    }

    if (this.editLocationForm.valid && this.selectedLocation) {
      const locationData = {
        name: this.editLocationForm.get('locationName')?.value,
        country: this.editLocationForm.get('country')?.value,
        state: this.editLocationForm.get('state')?.value,
        latitude: this.selectedLocation.lat,
        longitude: this.selectedLocation.lng,
        radius: this.radiusValue
      };

      this.loading = true;
      this.locationService.updateLocation(this.locationId, locationData).subscribe({
        next: () => {
          this.toastr.success('Location updated successfully');
          this.router.navigate(['/dashboard/location']);
        },
        error: (error: any) => {
          console.error('Error updating location:', error);
          this.toastr.error('Error updating location');
          this.loading = false;
        }
      });
    }
  }

  previousStep() {
    this.currentStep--;
  }

  onRadiusInput(event: any) {
    const newRadius = Number(event.target.value);
    this.attemptedRadius = newRadius;
    
    if (newRadius > this.maxRadius) {
      this.showRadiusLimitNotification();
      return;
    }
    
    if (newRadius >= this.minRadius && newRadius <= this.maxRadius) {
      this.radiusValue = newRadius;
      this.updateCircleRadius(newRadius);
    }
  }

  updateCircleRadius(radius: number) {
    if (!this.map?.googleMap || !this.markerPosition) return;

    if (!this.circleInstance) {
      // Create circle if it doesn't exist
      this.circleInstance = new google.maps.Circle({
        ...this.circleOptions,
        map: this.map.googleMap,
        center: this.markerPosition
      });
    }

    // Update existing circle
    this.circleInstance.setRadius(radius);
    this.circleOptions = {
      ...this.circleOptions,
      radius: radius
    };
  }

  showSubscriptionRequiredNotification() {
    this.upgradeNotificationService.showUpgradeNotification({
      show: true,
      heading: 'Subscription Required',
      subheading: 'You need an active subscription to add or modify locations. Please subscribe to continue.',
      autoHide: true
    });
  }

  showRadiusLimitNotification() {
    this.upgradeNotificationService.showUpgradeNotification({
      show: true,
      heading: 'Radius Limit Reached',
      subheading: `Your attempted radius (${this.attemptedRadius}m) exceeds your plan's limit of ${this.maxRadius}m. Please upgrade to increase your radius limit.`,
      autoHide: true
    });
  }

  // Clean up circle on component destroy
  ngOnDestroy() {
    if (this.circleInstance) {
      this.circleInstance.setMap(null);
      this.circleInstance = null;
    }
  }
}