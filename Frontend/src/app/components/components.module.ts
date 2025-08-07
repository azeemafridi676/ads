import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentsRoutingModule } from './components-routing.module';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbPagination } from '@ng-bootstrap/ng-bootstrap';
import { NgbHighlight } from '@ng-bootstrap/ng-bootstrap';
import { NgxDropzoneModule } from 'ngx-dropzone';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
import { SignupComponent } from './Auth/signup/signup.component';
import { OtpComponent } from './Auth/otp/otp.component';
import { LoginComponent } from './Auth/login/login.component';
import { ForgetPasswordComponent } from './Auth/forget-password/forget-password.component';
import { ResetPasswordComponent } from './Auth/reset-password/reset-password.component';
import { AdminDashboardComponent } from './dashboard/admin-dashboard/admin-dashboard.component';
import { UserDashboardComponent } from './dashboard/user-dashboard/user-dashboard.component';
import { RolesComponent } from './settings/roles/roles.component';
import { ProfileComponent } from './profile/profile.component';
import { UserSubscriptionsComponent } from './subscriptions/user-subscriptions/user-subscriptions.component';
import { AdminSubscriptionsComponent } from './subscriptions/admin-subscriptions/admin-subscriptions.component';
import { InvoicesComponent } from './invoices/invoices.component';
import { ContactComponent } from '../website/contact/contact.component';
import { HomeComponent } from '../website/home/home.component';
import { PricingComponent } from '../website/pricing/pricing.component';
import { WebNavComponent } from '../website/components/web-nav/web-nav.component';
import { WebFooterComponent } from '../website/components/web-footer/web-footer.component';
import { AddLocationComponent } from './location/addlocation/addlocation.component';
import { LocationListComponent } from './location/locations-list/location-list.component';
import { AvailableLocationsComponent } from './available-locations/available-locations.component';
import { GoogleMapsModule } from '@angular/google-maps';
import { CampaignsListComponent } from './campaigns/campaigns-list/campaigns-list.component';
import { CreateCampaignComponent } from './campaigns/create-campaign/create-campaign.component';
import { CustomerCampaignsComponent } from './campaigns/customer-campaigns/customer-campaigns.component';
import { AdminCampaignDetailsComponent } from './campaigns/admin-campaign-details/admin-campaign-details.component';
import { UserChatComponent } from './chat/user-chat/user-chat.component';
import { AdminChatComponent } from './chat/admin-chat/admin-chat.component';
import { CampaignDetailsComponent } from './campaigns/campaign-detail/campaign-details.component';
import { EditLocationComponent } from './location/edit-location/edit-location.component';
import { ConfirmationModalComponent } from '../shared/components/confirmation-modal/confirmation-modal.component';
import { UsersListComponent } from './users/users-list/users-list.component';
import { ListReviewsComponent } from './reviews/list-reviews/list-reviews.component';
import { AddReviewsComponent } from './reviews/add-reviews/add-reviews.component';
import { EditReviewsComponent } from './reviews/edit-reviews/edit-reviews.component';
import { AdminReviewsComponent } from './reviews/admin-reviews/admin-reviews.component';
import { AuthCallbackComponent } from './Auth/auth-callback/auth-callback.component';

@NgModule({
  declarations: [
    SignupComponent,
    OtpComponent,
    LoginComponent,
    ForgetPasswordComponent,
    ResetPasswordComponent,
    AdminDashboardComponent,
    UserDashboardComponent,
    RolesComponent,
    ProfileComponent,
    AddLocationComponent,
    LocationListComponent,
    UserSubscriptionsComponent,
    InvoicesComponent,
    ContactComponent,
    PricingComponent,
    HomeComponent,
    WebNavComponent,
    WebFooterComponent,
    AdminSubscriptionsComponent,
    AvailableLocationsComponent,
    CampaignsListComponent,
    CreateCampaignComponent,
    CustomerCampaignsComponent,
    AdminCampaignDetailsComponent,
    UserChatComponent,
    AdminChatComponent,
    CampaignDetailsComponent,
    EditLocationComponent,
    ConfirmationModalComponent,
    UsersListComponent,
    ListReviewsComponent,
    AddReviewsComponent,
    EditReviewsComponent,
    AdminReviewsComponent,
    AuthCallbackComponent
  ],
  imports: [
    CommonModule,
    ComponentsRoutingModule,
    SharedModule,
    FormsModule,
    NgbPagination,
    NgbHighlight,
    NgxDropzoneModule,
    CKEditorModule,
    ReactiveFormsModule,
    GoogleMapsModule
  ]
})
export class ComponentsModule {}
