import { Component, ElementRef, HostListener, OnInit, ViewChild, ViewChildren, QueryList, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { modalAnimation } from 'src/app/shared/animations/modal.animations';
import { NavService } from 'src/app/shared/service/navbar/nav.service';
import { SubscriptionsService } from 'src/app/shared/service/subscriptions/subscriptions.service';
@Component({
  selector: 'app-admin-subscriptions',
  templateUrl: './admin-subscriptions.component.html',
  styleUrl: './admin-subscriptions.component.scss',
  animations: [modalAnimation],
})
export class AdminSubscriptionsComponent implements OnInit, AfterViewInit {
  @ViewChildren('descriptionText') descriptionElements!: QueryList<ElementRef>;
  isVisible = false;
  selectedPlan: any;
  subscriptionForm: FormGroup;
  subscriptionEditForm: FormGroup;
  loading = true;
  isEdit = false;
  editLoading = false;
  deleteLoading: Record<string, boolean> = {};
  allPlans: any = [];
  selectedTab: string = 'monthly';
  visibilityLoading: { [key: string]: boolean } = {};

  constructor(private fb: FormBuilder, private toastr: ToastrService,private eRef: ElementRef, private subscriptionService: SubscriptionsService, private navService: NavService  ) {

    this.subscriptionForm = this.fb.group({
      planName: ['', Validators.required],
      description: ['', Validators.required],
      duration: [null, [Validators.required, Validators.pattern('^(1|12)$')]],
      price: [null, [Validators.required]],
      launchDate: [null, Validators.required],
      expiryDate: [null, Validators.required],
      locationLimit: [null, [Validators.required, Validators.min(1)]],
      campaignLimit: [null, [Validators.required, Validators.min(1)]],
      adVedioTimeLimit: [null, [Validators.required, Validators.min(1)]],
      adCampaignTimeLimit: [null, [Validators.required, Validators.min(1)]],
      priority: [null, [Validators.required, Validators.min(1)]],
      allowedRadius: [null, [Validators.required, Validators.min(1)]],
      runCycleLimit: [null, [Validators.required, Validators.min(1)]],
    });

    this.subscriptionEditForm = this.fb.group({
      _id: [''],
      planName: ['', Validators.required],
      description: ['', Validators.required],
      duration: [null, [Validators.required, Validators.min(1), Validators.max(36)]],
      price: [null, [Validators.required]],
      launchDate: [null, Validators.required],
      expiryDate: [null, Validators.required],
      campaignLimit: [null, [Validators.required, Validators.min(1)]],
      adVedioTimeLimit: [null, [Validators.required, Validators.min(1)]],
      adCampaignTimeLimit: [null, [Validators.required, Validators.min(1)]],
      locationLimit: [null, [Validators.required, Validators.min(1)]],
      priority: [null, [Validators.required, Validators.min(1)]],
      allowedRadius: [null, [Validators.required, Validators.min(1)]],
      runCycleLimit: [null, [Validators.required, Validators.min(1)]],
    });
  
  }
  ngOnInit(): void {
    this.getAllSubscriptions()
    this.navService.setTitle('Subscriptions Overview');
    this.navService.setSubtitle('Manage your ShowYourAdz subscriptions');
  }
  ngAfterViewInit() {
    this.checkDescriptionLengths();
    // Re-check when plans change
    this.descriptionElements.changes.subscribe(() => {
      this.checkDescriptionLengths();
    });
  }

  checkDescriptionLengths() {
    setTimeout(() => {
      this.descriptionElements.forEach((el: ElementRef, index: number) => {
        if (this.allPlans[index]) {
          const element = el.nativeElement;
          // Check if content height is greater than 2 lines (assuming line-height is about 1.5)
          const lineHeight = parseFloat(getComputedStyle(element).lineHeight);
          const maxHeight = lineHeight * 2;
          this.allPlans[index].needsExpansion = element.scrollHeight > maxHeight;
        }
      });
    });
  }

  getAllSubscriptions() {
    this.loading = true;
    this.subscriptionService.getSubscriptions().subscribe({
      next: ((res:any) => {
        this.allPlans = res.data.map((plan: any) => ({
          ...plan,
          isDescriptionExpanded: false,
          needsExpansion: false
        }));
        this.loading = false;
      }),
      error: (error: any) => {
        this.loading = false;
        this.toastr.error('Failed to load subscriptions');
      }
    })
  }
  toggleMenu(plan: any, event: Event) {
    event.stopPropagation();
    if (plan.isInUse) {
      this.toastr.info('This plan is currently in use and cannot be modified');
      return;
    }
    this.selectedPlan = this.selectedPlan?._id === plan._id ? null : plan;
  }

  getDurationErrorMessage(form: FormGroup): string {
    const durationControl = form.get('duration');
    if (durationControl?.errors) {
      if (durationControl.errors['required']) {
        return 'Duration is required';
      }
      if (durationControl.errors['pattern']) {
        return 'Duration must be either 1 (monthly) or 12 (yearly) months';
      }
    }
    return '';
  }

  addSubscription() {
    if (this.subscriptionForm.valid) {
      const duration = this.subscriptionForm.get('duration')?.value;
      if (duration > 36) {
        this.toastr.error('Subscription duration cannot exceed 36 months');
        return;
      }
      this.loading = true;
      this.subscriptionService.createSubscription(this.subscriptionForm.value).subscribe({
        next: (response: any) => {
          this.toastr.success(response.message);
          this.getAllSubscriptions();
          this.subscriptionForm.reset()
          this.loading = false;
          this.closeModal();
        },
        error: (error: any) => {
          this.toastr.error(error.message || 'Failed to create subscription');
          this.loading = false;
        },
      });
    } else {
      if (this.subscriptionForm.get('duration')?.errors) {
        this.toastr.error(this.getDurationErrorMessage(this.subscriptionForm));
      } else {
        this.toastr.error('Invalid Inputs!');
      }
    }
  }
  updateSubscription() {
    if (this.subscriptionEditForm.valid) {
      const duration = this.subscriptionEditForm.get('duration')?.value;
      if (duration > 36) {
        this.toastr.error('Subscription duration cannot exceed 36 months');
        return;
      }
      this.editLoading = true;
      this.subscriptionService.updateSubscription(this.subscriptionEditForm.value).subscribe({
        next: (response: any) => {
          this.toastr.success(response.message);
          this.getAllSubscriptions();
          this.subscriptionEditForm.reset()
          this.editLoading = false;
          this.closeEditModal();
        },
        error: (error: any) => {
          this.toastr.error('Failed to update subscription');
          this.editLoading = false;
        },
      });
    } else {
      if (this.subscriptionEditForm.get('duration')?.errors) {
        this.toastr.error(this.getDurationErrorMessage(this.subscriptionEditForm));
      } else {
        this.toastr.error('Invalid Inputs!');
      }
    }
  }
  deletePlan(plan: any, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.deleteLoading[plan._id] = true;
    this.subscriptionService.deleteSubscription(plan._id).subscribe({
      next: (response: any) => {
        this.toastr.success(response.message);
        this.getAllSubscriptions();
        this.deleteLoading[plan._id] = false;
        this.selectedPlan = null;
      },
      error: (error: any) => {
        this.toastr.error('Failed to delete subscription');
        this.deleteLoading[plan._id] = false;
        this.selectedPlan = null;
      },
    });
  }
  @HostListener('document:click', ['$event'])
  handleClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('#toggle')) {
      this.selectedPlan = null;
    }
  }
  editPlan(planData: any, event: Event) {
    event.stopPropagation();
    event.preventDefault();
    this.selectedPlan = null;
    this.isEdit = true;
    this.subscriptionEditForm.patchValue(planData);
  }
  openModal() {
    this.isVisible = true;
  }

  closeModal() {
    this.isVisible = false;
  }
  closeEditModal() {
    this.isEdit = false;
  }

  toggleVisibility(plan: any, event: Event) {
    event.stopPropagation();
    this.visibilityLoading[plan._id] = true;
    this.subscriptionService.toggleVisibility(plan._id).subscribe({
      next: (response: any) => {
        this.toastr.success(response.message);
        this.getAllSubscriptions();
        this.visibilityLoading[plan._id] = false;
      },
      error: (error: any) => {
        this.toastr.error(error.message || 'Failed to toggle visibility');
        this.visibilityLoading[plan._id] = false;
      }
    });
  }

  toggleDescription(plan: any, event: Event) {
    event.stopPropagation();
    plan.isDescriptionExpanded = !plan.isDescriptionExpanded;
  }

  hasPlansForSelectedPeriod(): boolean {
    return this.allPlans.some((plan: any) => 
      (plan.duration === 1 && this.selectedTab === 'monthly') || 
      (plan.duration === 12 && this.selectedTab === 'yearly')
    );
  }

  getNoPlansMessage(): string {
    return this.selectedTab === 'monthly' 
      ? 'No monthly subscription plans available. Click the button below to create a new monthly plan.' 
      : 'No yearly subscription plans available. Click the button below to create a new yearly plan.';
  }
}