// otp.component.ts
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/shared/service/Auth/Auth.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-otp',
  templateUrl: './otp.component.html',
  styleUrls: ['./otp.component.scss']
})
export class OtpComponent {
  otpForm: FormGroup;
  loading = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, private toastr: ToastrService) {
    this.otpForm = this.fb.group({
      otp: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.otpForm.valid) {
      this.loading = true;
      const otpData = this.otpForm.value;
      this.authService.verifyOtp(otpData.otp).subscribe({
        next: (response) => {
          this.authService.storeTokens(response.data);
          this.loading = false;
          this.toastr.success(response.message);
          const decodedToken = this.authService.getDecodedToken();
          let routeToHit = '/dashboard';
          if (decodedToken.role.includes('admin')) {
            routeToHit = '/dashboard/admin';
          }
          this.router.navigate([routeToHit]);
        },
        error: (res) => {
          this.loading = false;
          this.toastr.error(res.error.message);
        }
      });
    } else {
      this.toastr.error("Otp code is required.");
    }
  }

  resendOtp() {
    this.authService.resendOtpCode().subscribe({
      next: (response: any) => {
        this.toastr.success(response.message);
        this.authService.setVerificationId(response.data.verificationId);
      },
      error: (error: any) => {
        this.toastr.error(error);
      }
    });
  }
}
