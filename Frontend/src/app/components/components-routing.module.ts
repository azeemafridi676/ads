import { NgModule } from '@angular/core';
import { ActivatedRouteSnapshot, RouterModule, Routes } from '@angular/router';
var routingAnimation = localStorage.getItem('animate');
import { AuthGuard } from '../shared/guard/auth.guard';
import { RoleGuard } from '../shared/guard/role.guard';
import { AdminDashboardComponent } from './dashboard/admin-dashboard/admin-dashboard.component';
import { AdminSubscriptionsComponent } from './subscriptions/admin-subscriptions/admin-subscriptions.component';
import { UserSubscriptionsComponent } from './subscriptions/user-subscriptions/user-subscriptions.component';
import { ProfileComponent } from './profile/profile.component';
import { RolesComponent } from './settings/roles/roles.component';
import { AddLocationComponent } from './location/addlocation/addlocation.component';
import { LocationListComponent } from './location/locations-list/location-list.component';
import { EditLocationComponent } from './location/edit-location/edit-location.component';
import { PermissionsResolver } from '../shared/resolvers/permissionResolver';
import { InvoicesComponent } from './invoices/invoices.component';
import { UserDashboardComponent } from './dashboard/user-dashboard/user-dashboard.component';
import { AvailableLocationsComponent } from './available-locations/available-locations.component';
import { CampaignsListComponent } from './campaigns/campaigns-list/campaigns-list.component';
import { CreateCampaignComponent } from './campaigns/create-campaign/create-campaign.component';
import { CustomerCampaignsComponent } from './campaigns/customer-campaigns/customer-campaigns.component';
import { AdminCampaignDetailsComponent } from './campaigns/admin-campaign-details/admin-campaign-details.component';
import { UserChatComponent } from './chat/user-chat/user-chat.component';
import { AdminChatComponent } from './chat/admin-chat/admin-chat.component';
import { CampaignDetailsComponent } from './campaigns/campaign-detail/campaign-details.component';
import { UsersListComponent } from './users/users-list/users-list.component';
import { ListReviewsComponent } from './reviews/list-reviews/list-reviews.component';
import { AddReviewsComponent } from './reviews/add-reviews/add-reviews.component';
import { EditReviewsComponent } from './reviews/edit-reviews/edit-reviews.component';
import { AdminReviewsComponent } from './reviews/admin-reviews/admin-reviews.component';

const routes: Routes = [
  {
    path: '',
    canActivate:[AuthGuard],
    resolve:{Permissions:PermissionsResolver},
    children: [
    
      {
        path: 'settings',
        canActivate: [RoleGuard],
        data: {
          roles: ['admin']
        },
        children:[
          {
            path:'roles',
            component:RolesComponent
          },
          
          {
            path:'subscriptions',
            component:UserSubscriptionsComponent
          },
         
          
        ]
      },
      {
        path: 'admin',
        component: AdminDashboardComponent,
        canActivate:[RoleGuard],
        data:{
          roles:['admin']
        }
      },
      {
        path: 'chat-admin',
        component: AdminChatComponent,
        canActivate:[RoleGuard],
        data:{
          roles:['admin']
        }
      },
      {
        path: 'available-locations',
        component: AvailableLocationsComponent,
        canActivate:[RoleGuard],
        data:{
          roles:['admin']
        }
      },
      {
        path: 'admin-subscriptions',
        component: AdminSubscriptionsComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['admin']
        }
      },
      {
        path: 'customer-campaigns',
        component: CustomerCampaignsComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['admin']
        }
      },
      {
        path: 'admin-campaign-details/:id',
        component: AdminCampaignDetailsComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['admin']
        }
      },
      {
        path: 'subscriptions',
        component: UserSubscriptionsComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['user']
        }
      },
      {
        path: 'subscriptions/:session_id',
        component: UserSubscriptionsComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['user']
        }
      },
      {
        path: 'invoices',
        component: InvoicesComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['user']
        }
      },
      
      {
        path: 'profile',
        component: ProfileComponent,
      },
      {
        path: 'location',
        component: LocationListComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['user']
        }
      },
      {
        path: 'addlocation',
        component: AddLocationComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['user']
        }
      },
      {
        path: 'edit-location/:id',
        component: EditLocationComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['user']
        }
      },
      {
        path: 'campaigns',
        component: CampaignsListComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['user']
        }
      },
      {
        path: 'create-campaign',
        component: CreateCampaignComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['user']
        }
      },
      {
        path: 'update-campaign/:id',
        component: CreateCampaignComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['user']
        }
      },
      {
        path: 'campaign-details/:id',
        component: CampaignDetailsComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['user']
        }
      },
      {
        path: 'chat',
        component: UserChatComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['user']
        }
      },
      {
        path: '',
        component: UserDashboardComponent,
        canActivate:[RoleGuard],
        data:{
          roles:['user']
        }
      },
      {
        path: 'users',
        component: UsersListComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['admin']
        }
      },
      {
        path: 'admin-reviews',
        component: AdminReviewsComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['admin']
        }
      },
      {
        path: 'reviews',
        component: ListReviewsComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['user']
        }
      },
      {
        path: 'add-review',
        component: AddReviewsComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['user']
        }
      },
      {
        path: 'edit-review/:id',
        component: EditReviewsComponent,
        canActivate: [RoleGuard],
        data: {
          roles: ['user']
        }
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ComponentsRoutingModule {}
