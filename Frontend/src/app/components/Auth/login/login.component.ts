import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/shared/service/Auth/Auth.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { LoggingService } from 'src/app/shared/service/logging.service';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  showPassword = false;
  showBanModal = false;
  banDetails: { reason: string | null; bannedAt: Date | null } | null = null;
  private readonly SOURCE = 'login.component.ts';

  async ngOnInit() {
    if(this.authService.getDecodedToken()){
      if(this.authService.getDecodedToken().role.includes('admin')){
        this.router.navigate(['/dashboard/admin'])
      }else{
        this.router.navigate(['/dashboard'])
      }
    }
    // const userData = await firstValueFrom(this.authService.getUserDetails());
    // if (userData) {
    //   let routeToHit = '/'
    //   if (userData?.isAdmin) {
    //     routeToHit = '/subscriptions';
    //   }
    //   this.router.navigate([routeToHit])
    // }
  }
  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, public toastr: ToastrService, private loggingService: LoggingService) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
  onSubmit() {
    if (this.loginForm.valid) {
      this.loading = true;
      this.authService.login(this.loginForm.value).subscribe({
        next: (response: any) => {
          this.toastr.success(response.message);
          this.authService.setVerificationId(response.data.verificationId)
          this.loading = false;
          this.router.navigate(['/otp'])
        },
        error: (error: any) => {
          this.loading = false;
          if (error.error?.status === 403 && error.error?.data?.isBanned) {
            this.banDetails = {
              reason: error.error.data.banReason,
              bannedAt: new Date(error.error.data.bannedAt)
            };
            this.showBanModal = true;
          } else {
            const errorMessage = error.error ? error.error.message : "Something went wrong while logging in";
            this.toastr.error(errorMessage);
          }
        }
      });
    } else {
      this.toastr.error('Invalid Inputs!');
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  closeBanModal() {
    this.showBanModal = false;
    this.banDetails = null;
  }

  loginWithGoogle(): void {
    this.loggingService.log(this.SOURCE, 'login with google button is clicked in login component');
    this.authService.initiateGoogleAuth();
  }
}

