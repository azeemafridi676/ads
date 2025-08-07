import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LocationService } from 'src/app/shared/service/location/location.service';
import { GoogleMap, MapCircle, MapMarker } from '@angular/google-maps';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/shared/service/Auth/Auth.service';
import { UpgradeNotificationService } from 'src/app/shared/service/upgrade-notifiication/upgrade-notificatiion.service';
import { Router } from '@angular/router';
import { NavService } from 'src/app/shared/service/navbar/nav.service';
import { LoggingService } from 'src/app/shared/service/logging.service';
@Component({
  selector: 'app-addlocation',
  templateUrl: './addlocation.component.html',
  styleUrls: ['./addlocation.component.scss']
})
export class AddLocationComponent implements OnInit {
  @ViewChild(GoogleMap) map!: GoogleMap;
  @ViewChild(MapMarker) marker!: MapMarker;
  
  apiLoaded: boolean = false;
  currentStep = 1;
  addLocationForm: FormGroup;
  loading = false;
  states: any[] = [];
  selectedState: any = null;
  currentSubscription: any;
  locationLimit: number = 0;
  currentLocations: number = 0;
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

  // Add new properties
  radiusValue: number = 200; 
  maxRadius: number = 500; 
  minRadius: number = 100;  

  // Add a property to store attempted radius
  attemptedRadius: number = 0;

  constructor(
    private fb: FormBuilder,
    private locationService: LocationService,
    private toastr: ToastrService,
    private authService: AuthService,
    private upgradeNotificationService: UpgradeNotificationService,
    private router: Router,
    private navService: NavService,
    private loggingService: LoggingService
  ) {
    this.addLocationForm = this.fb.group({
      locationName: ['', [Validators.required, Validators.minLength(5)]],
      country: ['US', Validators.required],
      state: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.fetchStates();
    this.authService.getUserDetails().subscribe((user) => {
      this.currentSubscription = user.currentSubscription;
      this.loggingService.log('currentSubscription', this.currentSubscription);
      this.maxRadius = this.currentSubscription.allowedRadius;
      this.locationLimit = this.currentSubscription.locationLimit;
      this.checkLocationLimit();
    });
    this.navService.setTitle('Add New Location');
    this.navService.setSubtitle('Define location details and map coverage');
  }

  onStateChange(event: any) {
    const stateCode = event.target.value;
    console.log('***STATE: State Code:', stateCode);
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
    if (this.addLocationForm.valid) {
        this.currentStep++;
        if (this.currentStep === 2) {
            // Add a small delay to ensure map is initialized
            setTimeout(() => {
                if (!this.map?.googleMap) {
                    console.log('***BOUNDARIES: Waiting for map to initialize...');
                    setTimeout(() => {
                        this.initializeMapForState();
                    }, 1000); // Wait 1 second
                } else {
                    this.initializeMapForState();
                }
            }, 100);
        }
    }
  }

  async initializeMapForState() {
    console.log('***BOUNDARIES: Starting initializeMapForState');
    console.log('***BOUNDARIES: Selected State:', this.selectedState);
    console.log('***BOUNDARIES: Map Object:', this.map?.googleMap);

    if (this.selectedState && this.map?.googleMap) {
        try {
            const geocoder = new google.maps.Geocoder();
            
            await new Promise((resolve, reject) => {
                geocoder.geocode(
                    { address: `${this.selectedState}, USA` },
                    (results, status) => {
                        console.log('***BOUNDARIES: Geocoder Response Status:', status);
                        console.log('***BOUNDARIES: Geocoder Results:', results);

                        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
                            const place = results[0];
                            if (place.geometry?.viewport) {
                                this.map?.googleMap?.fitBounds(place.geometry.viewport);
                                
                                // Adjust zoom level
                                setTimeout(() => {
                                    const zoom = this.map?.googleMap?.getZoom() || 0;
                                    console.log('***BOUNDARIES: Current zoom:', zoom);
                                    this.map?.googleMap?.setZoom(Math.min(zoom, 8));
                                }, 100);

                                // Update center
                                const center = place.geometry.viewport.getCenter();
                                this.center = {
                                    lat: center.lat(),
                                    lng: center.lng()
                                };
                                console.log('***BOUNDARIES: Center updated:', this.center);
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

        } catch (error) {
            console.error('***BOUNDARIES ERROR:', error);
            alert('Error loading state. Please try again.');
        }
    } else {
        console.log('***BOUNDARIES: Either selectedState or map is not available');
    }
  }

  onMapClick(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      // Check if click is within state bounds
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
      } else {
        // Show error message
        alert('Please select a location within the state boundaries');
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
    if(!this.currentSubscription) {
      this.showSubscriptionRequiredNotification();
      return;
    }

    if(this.currentLocations >= this.locationLimit) {
      this.showLocationLimitNotification();
      return;
    }

    if(this.radiusValue > this.maxRadius) {
      this.showRadiusLimitNotification();
      return;
    }

    if (this.addLocationForm.valid && this.selectedLocation && this.radiusValue <= this.maxRadius) {
      const locationData = {
        locationName: this.addLocationForm.get('locationName')?.value,
        state: this.addLocationForm.get('state')?.value,
        latitude: this.selectedLocation.lat,
        longitude: this.selectedLocation.lng,
        radius: this.selectedLocation.radius
      };

      this.loading = true;
      this.locationService.addLocation(locationData).subscribe({
        next: (response) => {
          this.toastr.success('Location added successfully');
          this.router.navigate(['/dashboard/location']);
          this.loading = false;
        },
        error: (error) => {
          this.toastr.error(error.message || 'Failed to add location');
          console.error('Error adding location:', error);
          this.loading = false;
        }
      });
    }
  }

  handleSubmitClick() {
    if(this.currentLocations >= this.locationLimit) {
      this.showLocationLimitNotification();
      return;
    }
    this.onSubmit();
  }

  onCountryChange(event: any) {
    const countryId = event.target.value;
    console.log(countryId);
  }

  onMarkerDrag(event:any) {
    if (event.latLng && this.map?.googleMap) {
      const newPosition = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      };
      this.markerPosition = newPosition;
      this.selectedLocation = {
        ...this.selectedLocation,
        lat: newPosition.lat,
        lng: newPosition.lng
      };
    }
  }

  

  

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      
      // Reset map selections if going back from map step
      if (this.currentStep === 1) {
        this.markerPosition = null;
        this.selectedLocation = null;
        if (this.circle) {
          this.circle?.setMap(null);
        }
      }
    }
  }

  // Optional: Add this helper property if you need to reference the circle
  private get circle(): google.maps.Circle | null {
    return this.map?.googleMap?.get('circle') || null;
  }

  // Add radius control methods
  onRadiusInput(event: any) {
    if(event.target.value === '') {
      this.radiusValue = this.maxRadius;
      document.getElementById('radiusInput')?.setAttribute('value', this.maxRadius.toString());
      return;
    }
    const value = parseInt(event.target.value);
  
    if (value > this.maxRadius) {
      this.attemptedRadius = value;
      this.showRadiusLimitNotification();
      this.radiusValue = this.maxRadius;
      this.updateCircleRadius(this.maxRadius);
      return;
    }

    // Update radius if within limits
    this.radiusValue = value;
    this.updateCircleRadius(value);
  }

  updateCircleRadius(radius: number) {
    if (radius > this.maxRadius) {
      this.showRadiusLimitNotification();
      radius = this.maxRadius;
    }
    this.circleOptions = {
      ...this.circleOptions,
      radius: radius
    };
    this.selectedLocation = {
      ...this.selectedLocation,
      radius: radius
    };
    this.radiusValue = radius;
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

  checkLocationLimit() {
    this.locationService.getLocations().subscribe({
      next: (response: any) => {
        this.currentLocations = response.data.length;
      },
      error: (error) => {
        console.error('Error fetching locations:', error);
      }
    });
  }

  showLocationLimitNotification() {
    this.upgradeNotificationService.showUpgradeNotification({
      show: true,
      heading: 'Location Limit Reached',
      subheading: `You have reached your plan's limit of ${this.locationLimit} locations. Please upgrade to add more locations.`,
      autoHide: true
    });
  }
}
