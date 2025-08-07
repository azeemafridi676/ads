import { Component, OnInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from 'src/app/shared/service/Auth/Auth.service';
import { LocationService } from 'src/app/shared/service/location/location.service';
import { CampaignService } from 'src/app/shared/service/campaign/campaign.service';
import { ToastrService } from 'ngx-toastr';
import { Router, ActivatedRoute } from '@angular/router';
import { UpgradeNotificationService } from 'src/app/shared/service/upgrade-notifiication/upgrade-notificatiion.service';
import { NavService } from 'src/app/shared/service/navbar/nav.service';
import * as moment from 'moment-timezone';
import { environment } from 'src/environments/environment';

interface ImageDurationDialogResult {
  confirmed: boolean;
  duration?: number;
}

@Component({
  selector: 'app-create-campaign',
  templateUrl: './create-campaign.component.html',
  styleUrls: ['./create-campaign.component.scss']
})
export class CreateCampaignComponent implements OnInit {
  @ViewChild('mediaInput') mediaInput!: ElementRef;
  @ViewChild('durationModal') durationModal!: ElementRef;
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  
  currentStep = 1;
  campaignForm: FormGroup;
  loading = false;
  currentSubscription: any;
  locations: any[] = [];
  selectedLocations: any[] = [];
  mediaPreview: string | null = null;
  mediaType: 'video' | 'image' | null = null;
  mediaDuration: number = 0;
  imageDuration: number = 10;
  showDurationModal = false;
  modalResolve: ((value: ImageDurationDialogResult) => void) | null = null;
  isEditMode = false;
  campaignId: string | null = null;
  originalMediaUrl: string | null = null;
  currentCampaigns: number = 0;

  // New properties for upload handling
  uploadProgress: number = 0;
  isUploading: boolean = false;
  uploadError: string | null = null;
  finalS3Url: string | null = null;

  // Add time picker modal properties
  showTimeModal = false;
  timeModalType: 'start' | 'end' = 'start';
  selectedHour: number = 12;
  selectedMinute: number = 0;
  selectedPeriod: 'AM' | 'PM' = 'AM';
  hours = Array.from({length: 12}, (_, i) => i + 1);
  minutes = Array.from({length: 60}, (_, i) => i);

  // Add input validation methods
  validateHour() {
    let hour = parseInt(this.selectedHour.toString());
    if (isNaN(hour) || hour < 1) hour = 1;
    if (hour > 12) hour = 12;
    this.selectedHour = hour;
    this.cd.detectChanges();
  }

  validateMinute() {
    let minute = parseInt(this.selectedMinute.toString());
    if (isNaN(minute) || minute < 0) minute = 0;
    if (minute > 59) minute = 59;
    this.selectedMinute = minute;
    this.cd.detectChanges();
  }

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private locationService: LocationService,
    private campaignService: CampaignService,
    private toastr: ToastrService,
    private router: Router,
    private upgradeNotificationService: UpgradeNotificationService,
    private navService: NavService,
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute
  ) {
    if (!environment.TZ) {
      throw new Error('Timezone (TZ) must be defined in environment configuration');
    }
    
    this.campaignForm = this.fb.group({
      campaignName: ['', [Validators.required, Validators.minLength(5)]],
      startDateTime: ['', Validators.required],
      endDateTime: ['', [Validators.required, this.endDateAfterStartDateValidator()]],
      mediaFile: [null]
    });
  }

  ngOnInit() {
    this.checkSubscription();
    this.fetchLocations();
    this.fetchCurrentCampaigns();
    this.initializeForm();
    this.checkEditMode();
  }

  private initializeForm() {
    this.campaignForm = this.fb.group({
      campaignName: ['', [Validators.required, Validators.minLength(5)]],
      startDateTime: ['', Validators.required],
      endDateTime: ['', [Validators.required, this.endDateAfterStartDateValidator()]],
      mediaFile: [null]
    });
  }

  private checkEditMode() {
    this.campaignId = this.route.snapshot.params['id'];
    if(this.campaignId){
      this.isEditMode = true;
      this.loadCampaignData();
    }
    this.navService.setTitle(this.isEditMode ? 'Edit Campaign' : 'Create Campaign');
    this.navService.setSubtitle(this.isEditMode ? 'Update campaign details, locations, and media' : 'Set campaign details, locations, and media');
  }

  private loadCampaignData() {
    if (!this.campaignId) return;

    this.campaignService.getCampaignById(this.campaignId).subscribe({
      next: (res) => {
        const campaign=res.data;
        this.campaignForm.patchValue({
          campaignName: campaign.campaignName,
          startDateTime: this.formatDateTime(campaign.startDateTime),
          endDateTime: this.formatDateTime(campaign.endDateTime)
        });
        this.campaignForm.patchValue({ selectedLocations: campaign.selectedLocations });
        this.selectedLocations = campaign.selectedLocations;
        this.mediaType = campaign.mediaType;
        this.mediaDuration = campaign.mediaDuration;
        this.originalMediaUrl = campaign.mediaUrl;
        this.mediaPreview = campaign.mediaUrl;
        this.cd.detectChanges();
        
        if (this.mediaType === 'image') {
          this.imageDuration = this.mediaDuration ; 
        }

        this.cd.detectChanges();
      },
      error: (error) => {
        this.toastr.error('Failed to load campaign data');
      }
    });
  }

  isLocationSelected(location: any): boolean {
    return this.selectedLocations.some(selected => selected._id === location._id);
  }

  private formatDateTime(dateString: string): string {
    return moment(dateString).tz(environment.TZ).format('YYYY-MM-DDTHH:mm');
  }

  checkSubscription() {
    this.authService.getUserDetails().subscribe({
      next: (user) => {
        this.currentSubscription = user.currentSubscription;
      },
      error: (error) => {
        this.toastr.error('Failed to fetch subscription details');
      }
    });
  }

  showCampaignDurationLimitNotification(currentDuration: number, requiredDuration: number) {
    this.upgradeNotificationService.showUpgradeNotification({
      show: true,
      heading: 'Campaign Duration Limit Exceeded',
      subheading: `Your current plan allows ${this.currentSubscription.adCampaignTimeLimit} days. Please upgrade to extend your campaign duration.`,
      autoHide: true
    });
  }

  showLocationLimitNotification() {
    this.upgradeNotificationService.showUpgradeNotification({
      show: true,
      heading: 'Location Selection Limit Reached',
      subheading: `Your current plan allows ${this.currentSubscription.locationLimit} locations. Please upgrade to select more locations.`,
      autoHide: true
    });
  }

  showVideoLimitNotification() {
    this.upgradeNotificationService.showUpgradeNotification({
      show: true,
      heading: 'Video Duration Limit Exceeded',
      subheading: `Your current plan allows ${this.currentSubscription.adVedioTimeLimit} seconds. Please upgrade to use longer videos.`,
      autoHide: true
    });
  }

  fetchLocations() {
    this.locationService.getLocations().subscribe({
      next: (response) => {
        this.locations = response.data;
      },
      error: (error) => {
        this.toastr.error('Failed to fetch locations');
      }
    });
  }

  validateCampaignDuration(): boolean {
    const startDate = new Date(this.campaignForm.get('startDateTime')?.value);
    const endDate = new Date(this.campaignForm.get('endDateTime')?.value);
    const durationInDays = (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);
    
    if(!this.currentSubscription){
      this.toastr.error('You need to subscribe to create a campaign');
      return false;
    }

    if (durationInDays > this.currentSubscription.adCampaignTimeLimit) {
      this.upgradeNotificationService.showUpgradeNotification({
        show: true,
        heading: 'Campaign Duration Limit Exceeded',
        subheading: `Your current plan allows ${this.currentSubscription.adCampaignTimeLimit} days. Please upgrade to extend your campaign duration.`,
        autoHide: true
      });
      return false;
    }
    return true;
  }

  validateLocationCount(): boolean {
    return this.selectedLocations.length <= this.currentSubscription.locationLimit;
  }

  toggleLocationSelection(location: any): void {
    const index = this.selectedLocations.findIndex(selected => selected._id === location._id);
    if (index === -1) {
      if (this.selectedLocations.length >= this.currentSubscription?.locationLimit) {
        this.toastr.warning(`You can only select up to ${this.currentSubscription.locationLimit} locations`);
        return;
      }
      this.selectedLocations.push(location);
    } else {
      this.selectedLocations.splice(index, 1);
    }
  }

  resetMedia() {
    this.mediaPreview = this.isEditMode ? this.originalMediaUrl : null;
    this.mediaType = this.isEditMode ? this.mediaType : null;
    this.mediaDuration = this.isEditMode ? this.mediaDuration : 0;
    this.imageDuration = this.isEditMode ? this.mediaDuration : 0;
    this.uploadProgress = 0;
    this.isUploading = false;
    this.uploadError = null;
    this.finalS3Url = this.isEditMode ? this.originalMediaUrl : null;
    this.campaignForm.patchValue({ mediaFile: null });
    
    // Reset file input
    if (this.mediaInput) {
      this.mediaInput.nativeElement.value = '';
    }
  }

  isVideoDurationValid(): boolean {
    if (!this.currentSubscription) return false;
    
    const maxSeconds = this.currentSubscription.adVedioTimeLimit * 60;
    
    if (this.mediaType === 'video' || this.mediaType === 'image') {
      return this.mediaDuration <= maxSeconds && this.mediaDuration > 0;
    }
    return false;
  }

  onDurationChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target) {
      const valueInSeconds = parseInt(target.value);
      const maxSeconds = this.currentSubscription?.adVedioTimeLimit * 60 || 10;
      
      if (valueInSeconds < 0 || valueInSeconds > maxSeconds) {
        this.showVideoLimitNotification();
        // Set to max allowed duration
        this.mediaDuration = maxSeconds;
        this.imageDuration = maxSeconds;
        // Update the input value to show the max allowed duration
        target.value = maxSeconds.toString();
        return;
      }
      
      // Update both durations to keep them in sync
      this.mediaDuration = valueInSeconds;
      this.imageDuration = valueInSeconds;
      
      // Force change detection to update the button state
      this.cd.detectChanges();
    }
  }

  async handleMediaUpload(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Only reset media if this is a new upload attempt
    if (!this.isUploading) {
      this.resetMedia();
    }

    try {
      this.isUploading = true;
      this.uploadProgress = 0;
      this.uploadError = null;

      // Set media type and validate
      if (file.type.startsWith('image/')) {
        this.mediaType = 'image';
        // Set default duration to subscription limit if available, otherwise 10 seconds
        const maxSeconds = this.currentSubscription?.adVedioTimeLimit * 60 || 10;
        this.mediaDuration = Math.min(600, maxSeconds);
        this.imageDuration = this.mediaDuration;
      } else if (file.type.startsWith('video/')) {
        this.mediaType = 'video';
        const videoDuration = await this.getVideoDuration(file);
        
        if (videoDuration > this.currentSubscription.adVedioTimeLimit * 60) {
          this.showVideoLimitNotification();
          this.resetMedia();
          return;
        }
        this.mediaDuration = videoDuration;
      } else {
        this.toastr.error('Invalid file type. Please upload an image or video file.');
        this.resetMedia();
        return;
      }

      // Validate file size (optional - adjust size limit as needed)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        this.toastr.error('File size too large. Maximum size is 100MB.');
        this.resetMedia();
        return;
      }

      // Get presigned URL with error handling
      const response = await this.campaignService.generateUploadUrl(file).toPromise();
      if (!response || !response.presignedUrl || !response.finalS3Url) {
        throw new Error('Failed to generate upload URL');
      }

      const { presignedUrl, finalS3Url } = response;
      
      // Upload file to S3 with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          await this.campaignService.uploadFileToS3(presignedUrl, file, (progress) => {
            this.uploadProgress = progress;
            this.cd.detectChanges();
          }).toPromise();
          break; // Success, exit retry loop
        } catch (uploadError) {
          retryCount++;
          if (retryCount === maxRetries) {
            throw uploadError; // Rethrow if all retries failed
          }
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      // Store the final URL and create preview
      this.finalS3Url = finalS3Url;
      this.createMediaPreview(file);
      this.isUploading = false;
      this.toastr.success('File uploaded successfully');

    } catch (error: any) {
      this.uploadError = error.message || 'Upload failed. Please try again.';
      this.toastr.error(this.uploadError || 'Upload failed. Please try again.');
      // Don't reset media here to allow retry
      this.isUploading = false;
    } finally {
      this.cd.detectChanges();
    }
  }

  getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        resolve(video.duration);
      };
      video.src = URL.createObjectURL(file);
    });
  }

  createMediaPreview(file: File) {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.mediaPreview = e.target.result;
      this.cd.detectChanges();
    };
    reader.onerror = () => {
      this.toastr.error('Failed to create preview');
      this.cd.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  nextStep() {
    if (this.currentStep === 1) {
      if (!this.validateCampaignDuration()) {
        return;
      }
    }
    
    if (this.currentStep === 2) {
      if (!this.validateLocationCount()) {
        this.showLocationLimitNotification();
        return;
      }
      if (this.selectedLocations.length === 0) {
        this.toastr.error('Please select at least one location');
        return;
      }
    }

    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  fetchCurrentCampaigns() {
    this.campaignService.getCampaigns().subscribe({
      next: (response) => {
        this.currentCampaigns = response.data.length;
      },
      error: (error) => {
        console.error('Error fetching campaigns:', error);
      }
    });
  }

  showCampaignLimitNotification() {
    this.upgradeNotificationService.showUpgradeNotification({
      show: true,
      heading: 'Campaign Limit Reached',
      subheading: `You have reached your plan's limit of ${this.currentSubscription.campaignLimit} campaigns. Please upgrade to create more campaigns.`,
      autoHide: true
    });
  }

  showSubscriptionRequiredNotification() {
    this.upgradeNotificationService.showUpgradeNotification({
      show: true,
      heading: 'Subscription Required',
      subheading: 'You need an active subscription to create campaigns. Please subscribe to continue.',
      autoHide: true
    });
  }

  onSubmit() {
    if(!this.currentSubscription) {
      this.showSubscriptionRequiredNotification();
      return;
    }

    if(this.currentCampaigns >= this.currentSubscription.campaignLimit) {
      this.showCampaignLimitNotification();
      return;
    }

    const mediaUrl = this.finalS3Url || this.originalMediaUrl || '';
    if (this.campaignForm.valid && (this.finalS3Url || (this.isEditMode && this.originalMediaUrl))) {
      this.loading = true;
      const formData = this.campaignService.prepareCampaignFormData({
        campaignName: this.campaignForm.get('campaignName')?.value,
        startDateTime: this.campaignForm.get('startDateTime')?.value,
        endDateTime: this.campaignForm.get('endDateTime')?.value,
        selectedLocations: this.selectedLocations,
        mediaType: this.mediaType,
        mediaDuration: this.mediaDuration
      }, mediaUrl);

      const request$ = this.isEditMode 
        ? this.campaignService.updateCampaign(this.campaignId!, formData)
        : this.campaignService.createCampaign(formData);

      request$.subscribe({
        next: () => {
          this.toastr.success(`Campaign ${this.isEditMode ? 'updated' : 'created'} successfully`);
          this.router.navigate(['/dashboard/campaigns']);
        },
        error: (error) => {
          this.toastr.error(error.error.message || error.message || `Failed to ${this.isEditMode ? 'update' : 'create'} campaign`);
          this.loading = false;
        }
      });
    } else {
      if (!this.finalS3Url && !this.isEditMode) {
        this.toastr.error('Please upload a media file first');
      } else if (!this.finalS3Url && !this.originalMediaUrl) {
        this.toastr.error('Please upload a media file first');
      }
    }
  }

  getDateValue(controlName: string): string {
    const value = this.campaignForm.get(controlName)?.value;
    return value ? value.split('T')[0] : '';
  }

  getTimeValue(controlName: string): string {
    const value = this.campaignForm.get(controlName)?.value;
    return value ? value.split('T')[1] : '';
  }

  onDateChange(event: Event, type: 'start' | 'end') {
    const target = event.target as HTMLInputElement;
    const controlName = type === 'start' ? 'startDateTime' : 'endDateTime';
    const currentValue = this.campaignForm.get(controlName)?.value;
    const currentTime = currentValue ? currentValue.split('T')[1] : '00:00';
    
    const newDateTime = `${target.value}T${currentTime}`;
    this.campaignForm.patchValue({
      [controlName]: newDateTime
    });

    // If start date changes, validate end date
    if (type === 'start') {
      this.campaignForm.get('endDateTime')?.updateValueAndValidity();
    }
  }

  onTimeChange(event: Event, type: 'start' | 'end') {
    const target = event.target as HTMLInputElement;
    const controlName = type === 'start' ? 'startDateTime' : 'endDateTime';
    const currentValue = this.campaignForm.get(controlName)?.value;
    const currentDate = currentValue ? currentValue.split('T')[0] : moment().format('YYYY-MM-DD');
    
    const newDateTime = `${currentDate}T${target.value}`;
    this.campaignForm.patchValue({
      [controlName]: newDateTime
    });
  }

  // Add time picker modal methods
  selectPresetTime(time: string, period: 'AM' | 'PM') {
    const [hours, minutes] = time.split(':').map(Number);
    this.selectedHour = hours;
    this.selectedMinute = minutes;
    this.selectedPeriod = period;
  }

  isPresetTimeSelected(time: string, period: 'AM' | 'PM'): boolean {
    const [hours, minutes] = time.split(':').map(Number);
    return this.selectedHour === hours && 
           this.selectedMinute === minutes && 
           this.selectedPeriod === period;
  }

  onHourChange(event: any) {
    let hour = parseInt(event);
    if (isNaN(hour) || hour < 1) hour = 1;
    if (hour > 12) hour = 12;
    this.selectedHour = hour;
    this.cd.detectChanges();
  }

  onMinuteChange(event: any) {
    let minute = parseInt(event);
    if (isNaN(minute) || minute < 0) minute = 0;
    if (minute > 59) minute = 59;
    this.selectedMinute = minute;
    this.cd.detectChanges();
  }

  adjustHour(change: number) {
    let newHour = this.selectedHour + change;
    if (newHour > 12) newHour = 1;
    if (newHour < 1) newHour = 12;
    this.selectedHour = newHour;
    this.cd.detectChanges();
  }

  adjustMinute(change: number) {
    let newMinute = this.selectedMinute + change;
    if (newMinute >= 60) newMinute = 0;
    if (newMinute < 0) newMinute = 55;
    this.selectedMinute = newMinute;
    this.cd.detectChanges();
  }

  openTimeModal(type: 'start' | 'end') {
    this.timeModalType = type;
    const currentTime = type === 'start' 
      ? this.getTimeValue('startDateTime')
      : this.getTimeValue('endDateTime');
    
    if (currentTime) {
      const [hours, minutes] = currentTime.split(':').map(Number);
      this.selectedHour = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
      this.selectedMinute = minutes;
      this.selectedPeriod = hours >= 12 ? 'PM' : 'AM';
    } else {
      // Default to current time if no time is set
      const now = new Date();
      this.selectedHour = now.getHours() > 12 ? now.getHours() - 12 : (now.getHours() === 0 ? 12 : now.getHours());
      this.selectedMinute = Math.floor(now.getMinutes() / 5) * 5; // Round to nearest 5 minutes
      this.selectedPeriod = now.getHours() >= 12 ? 'PM' : 'AM';
    }
    
    this.showTimeModal = true;
  }

  closeTimeModal() {
    this.showTimeModal = false;
  }

  confirmTimeSelection() {
    let hours = parseInt(this.selectedHour.toString());
    let minutes = parseInt(this.selectedMinute.toString());
    
    // Validate inputs again before confirming
    if (isNaN(hours) || hours < 1 || hours > 12) hours = 12;
    if (isNaN(minutes) || minutes < 0 || minutes > 59) minutes = 0;

    // Convert to 24-hour format
    if (this.selectedPeriod === 'PM' && hours !== 12) {
      hours += 12;
    } else if (this.selectedPeriod === 'AM' && hours === 12) {
      hours = 0;
    }

    const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    const currentDate = this.timeModalType === 'start' 
      ? this.getDateValue('startDateTime')
      : this.getDateValue('endDateTime');

    const newDateTime = `${currentDate}T${time}`;
    this.campaignForm.patchValue({
      [`${this.timeModalType}DateTime`]: newDateTime
    });

    this.closeTimeModal();
  }

  // Add this new validator method
  private endDateAfterStartDateValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const startDate = this.campaignForm?.get('startDateTime')?.value;
      const endDate = control.value;

      if (!startDate || !endDate) {
        return null;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end < start) {
        return { endDateBeforeStartDate: true };
      }

      return null;
    };
  }
}
