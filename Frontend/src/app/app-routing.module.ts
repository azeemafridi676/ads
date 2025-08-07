import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContentComponent } from './shared/layout/content/content.component';
import { content } from './shared/routes/routes/routers';
import { LoginComponent } from './components/Auth/login/login.component';
import { SignupComponent } from './components/Auth/signup/signup.component';
import { OtpComponent } from './components/Auth/otp/otp.component';
import { AuthGuard } from './shared/guard/auth.guard';
import { ForgetPasswordComponent } from './components/Auth/forget-password/forget-password.component';
import { ResetPasswordComponent } from './components/Auth/reset-password/reset-password.component';
import { ContactComponent } from './website/contact/contact.component';
import { HomeComponent } from './website/home/home.component';
import { PricingComponent } from './website/pricing/pricing.component';
import { AuthCallbackComponent } from './components/Auth/auth-callback/auth-callback.component';

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    data: { animation: 'LoginPage' },
  },
  {
    path: '',
    component: HomeComponent,
    data: { animation: 'HomePage' },
  },
  {
    path: 'contact',
    component: ContactComponent,
    data: { animation: 'ContactPage' },
  },
  {
    path: 'pricing',
    component: PricingComponent,
    data: { animation: 'PricingPage' },
  },
  {
    path: 'signup',
    component: SignupComponent,
    data: { animation: 'SignupPage' },
  },
  {
    path: 'otp',
    component: OtpComponent,
    data: { animation: 'OtpPage' },
  },
  {
    path: 'forgot-password',
    component: ForgetPasswordComponent,
    data: { animation: 'ForgotPasswordPage' },
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    data: { animation: 'ResetPasswordPage' },
  },
  {
    path: 'auth/callback',
    component: AuthCallbackComponent,
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    component: ContentComponent,
    children: content,
    data: { animation: 'DashboardPage' },
  },
  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
