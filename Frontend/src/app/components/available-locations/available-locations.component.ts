import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { LocationService } from 'src/app/shared/service/location/location.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { NavService } from 'src/app/shared/service/navbar/nav.service';

@Component({
  selector: 'app-available-locations',
  templateUrl: './available-locations.component.html',
  styleUrls: ['./available-locations.component.scss'],
  animations: [
    trigger('modalAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
      ])
    ])
  ]
})
export class AvailableLocationsComponent implements OnInit {
  states: any[] = [];
  loading: boolean = false;
  showAddStateModal: boolean = false;
  
  usStatesList = [
    { name: 'Alabama', code: 'AL' },
    { name: 'Alaska', code: 'AK' },
    { name: 'Arizona', code: 'AZ' },
    { name: 'Arkansas', code: 'AR' },
    { name: 'California', code: 'CA' },
    { name: 'Colorado', code: 'CO' },
    { name: 'Connecticut', code: 'CT' },
    { name: 'Delaware', code: 'DE' },
    { name: 'Florida', code: 'FL' },
    { name: 'Georgia', code: 'GA' },
    { name: 'Hawaii', code: 'HI' },
    { name: 'Idaho', code: 'ID' },
    { name: 'Illinois', code: 'IL' },
    { name: 'Indiana', code: 'IN' },
    { name: 'Iowa', code: 'IA' },
    { name: 'Kansas', code: 'KS' },
    { name: 'Kentucky', code: 'KY' },
    { name: 'Louisiana', code: 'LA' },
    { name: 'Maine', code: 'ME' },
    { name: 'Maryland', code: 'MD' },
    { name: 'Massachusetts', code: 'MA' },
    { name: 'Michigan', code: 'MI' },
    { name: 'Minnesota', code: 'MN' },
    { name: 'Mississippi', code: 'MS' },
    { name: 'Missouri', code: 'MO' },
    { name: 'Montana', code: 'MT' },
    { name: 'Nebraska', code: 'NE' },
    { name: 'Nevada', code: 'NV' },
    { name: 'New Hampshire', code: 'NH' },
    { name: 'New Jersey', code: 'NJ' },
    { name: 'New Mexico', code: 'NM' },
    { name: 'New York', code: 'NY' },
    { name: 'North Carolina', code: 'NC' },
    { name: 'North Dakota', code: 'ND' },
    { name: 'Ohio', code: 'OH' },
    { name: 'Oklahoma', code: 'OK' },
    { name: 'Oregon', code: 'OR' },
    { name: 'Pennsylvania', code: 'PA' },
    { name: 'Rhode Island', code: 'RI' },
    { name: 'South Carolina', code: 'SC' },
    { name: 'South Dakota', code: 'SD' },
    { name: 'Tennessee', code: 'TN' },
    { name: 'Texas', code: 'TX' },
    { name: 'Utah', code: 'UT' },
    { name: 'Vermont', code: 'VT' },
    { name: 'Virginia', code: 'VA' },
    { name: 'Washington', code: 'WA' },
    { name: 'West Virginia', code: 'WV' },
    { name: 'Wisconsin', code: 'WI' },
    { name: 'Wyoming', code: 'WY' }
  ];

  stateForm: FormGroup;
  selectedStates: any[] = [];

  constructor(
    private locationService: LocationService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private navService: NavService
  ) {
    this.stateForm = this.fb.group({
      statesList: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.getStates();
    this.navService.setTitle('Available States');
    this.navService.setSubtitle('Manage available states');
  }

  deleteState(state: any) {
    this.locationService.deleteState(state._id).subscribe({
      next: () => this.getStates(),
      error: (error) => this.toastr.error('Failed to delete state')
    });
  }

  getStates() {
    this.loading = true;
    this.locationService.getStates().subscribe({
      next: (response: any) => {
        this.states = response;
        this.loading = false;
      },
      error: (error) => {
        this.toastr.error('Failed to load states');
        this.loading = false;
      }
    });
  }

  onStateSelect(event: any) {
    const selectedState = this.usStatesList.find(state => 
      state.name === event.target.value
    );
    
    if (selectedState && !this.selectedStates.some(s => s.name === selectedState.name)) {
      this.selectedStates.push(selectedState);
      this.stateForm.get('statesList')?.setValue('');
    }
  }

  removeState(state: any) {
    this.selectedStates = this.selectedStates.filter(s => s.name !== state.name);
  }

  addState() {
    if (this.selectedStates.length > 0) {
      this.loading = true;
      this.locationService.addState(this.selectedStates).subscribe({
        next: (response: any) => {
          this.toastr.success('States added successfully');
          this.getStates();
          this.showAddStateModal = false;
          this.stateForm.reset();
          this.selectedStates = [];
          this.loading = false;
        },
        error: (error) => {
          this.toastr.error('Failed to add states');
          this.loading = false;
        }
      });
    }
  }

  searchStates(event: any) {
    const searchTerm = event.target.value.toLowerCase();
    if (searchTerm) {
      this.states = this.states.filter(state => 
        state.name.toLowerCase().includes(searchTerm)
      );
    } else {
      this.getStates();
    }
  }
}
