import { Component, OnInit } from '@angular/core';
import { LocationService } from 'src/app/shared/service/location/location.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { NavService } from 'src/app/shared/service/navbar/nav.service';

interface LocationResponse {
  status: number;
  message: string;
  data: any[];
}

interface Location {
  _id: string;
  locationName: string;
  state: string;
  latitude: number;
  longitude: number;
  radius: number;
  isUsedInApprovedCampaign?: boolean;
}

@Component({
  selector: 'app-locations-list',
  templateUrl: './location-list.component.html',
  styleUrls: ['./location-list.component.scss']
})
export class LocationListComponent implements OnInit {
  locations: Location[] = [];
  loading = false;
  searchTerm: string = '';
  
  // Delete modal properties
  showDeleteModal = false;
  locationToDelete: Location | null = null;

  constructor(
    private locationService: LocationService,
    private toastr: ToastrService,
    private router: Router,
    private navService: NavService
  ) {}

  ngOnInit() {
    this.loadLocations();
    this.navService.setTitle('Locations Overview');
    this.navService.setSubtitle('Manage your advertising locations');
  }

  loadLocations() {
    this.loading = true;
    this.locationService.getLocationsWithCampaignStatus().subscribe({
      next: (response: LocationResponse) => {
        this.locations = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading locations:', error);
        this.toastr.error('Error loading locations');
        this.loading = false;
      }
    });
  }

  onDeleteClick(location: Location) {
    if (location.isUsedInApprovedCampaign) {
      this.toastr.warning('Cannot delete location as it is being used in an approved campaign');
      return;
    }
    this.locationToDelete = location;
    this.showDeleteModal = true;
  }

  onEditLocation(location: Location) {
    if (location.isUsedInApprovedCampaign) {
      this.toastr.warning('Cannot edit location as it is being used in an approved campaign');
      return;
    }
    this.router.navigate(['/dashboard/edit-location', location._id]);
  }

  onDeleteConfirm() {
    if (this.locationToDelete) {
      this.locationService.deleteLocation(this.locationToDelete._id).subscribe({
        next: () => {
          this.toastr.success('Location deleted successfully');
          this.loadLocations();
          this.showDeleteModal = false;
          this.locationToDelete = null;
        },
        error: (error) => {
          console.error('Error deleting location:', error);
          this.toastr.error('Error deleting location');
          this.showDeleteModal = false;
          this.locationToDelete = null;
        }
      });
    }
  }

  onDeleteCancel() {
    this.showDeleteModal = false;
    this.locationToDelete = null;
  }

  searchLocations() {
    if (this.searchTerm.trim()) {
      const searchTermLower = this.searchTerm.toLowerCase();
      this.locationService.getLocationsWithCampaignStatus().subscribe({
        next: (response: LocationResponse) => {
          this.locations = response.data.filter(location => 
            location.locationName.toLowerCase().includes(searchTermLower)
          );
        },
        error: (error) => {
          console.error('Error searching locations:', error);
          this.toastr.error('Error searching locations');
        }
      });
    } else {
      this.loadLocations();
    }
  }
}
