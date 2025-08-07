// otp.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../shared/services/Auth/Auth.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
import { GobackComponent } from '../../shared/components/goback/goback.component';
import { RouterLink } from '@angular/router';
import { LoggingService } from '../../shared/services/logging.service';

@Component({
  selector: 'app-otp',
  templateUrl: './otp.component.html',
  styleUrls: ['./otp.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SpinnerComponent,
    GobackComponent,
    RouterLink
  ]
})
export class OtpComponent {
  otpForm: FormGroup;
  loading = false
  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private toastr: ToastrService, private loggingService: LoggingService) {
    this.otpForm = this.fb.group({
      otp: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (!this.otpForm.valid) {
      this.toastr.error("OTP code is required.");
      return;
    }

    this.loading = true;
    const otpData = this.otpForm.value;
    this.authService.verifyOtp(otpData.otp).subscribe({
      next: (response) => {
        if (!response?.data?.accessToken || !response?.data?.refreshToken) {
          this.loading = false;
          this.toastr.error('Invalid authentication data received');
          return;
        }
        this.authService.storeTokens(response.data);
        
        this.authService.verifyToken(response.data.accessToken, response.data.refreshToken)
          .subscribe(isValid => {
            this.loading = false;
            
            if (isValid) {
              this.toastr.success(response.message);
              const decodedToken = this.authService.getDecodedToken();
              this.router.navigate(['/app/create-connection']);
            } else {
              this.toastr.error('Token verification failed');
              this.router.navigate(['/login']);
            }
          });
      },
      error: (error: any) => {
        this.loading = false;
        this.toastr.error(error.error?.message || 'Failed to verify OTP');
      }
    });
  }
  resendOtp() {
    this.authService.resendOtpCode().subscribe({
      next: (response: any) => {
        this.toastr.success(response.message);
        this.authService.setVerificationId(response.data.verificationId)

      },
      error: (error: any) => {
        this.toastr.error(error);
      }
    });
  }


}
