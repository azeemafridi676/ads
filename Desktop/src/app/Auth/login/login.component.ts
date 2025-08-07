import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../shared/services/Auth/Auth.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { LoggingService } from '../../shared/services/logging.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../shared/shared.module';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    RouterLink
  ]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  showPassword = false;
  async ngOnInit() {
    const token = this.authService.getAccessToken();
    const refreshToken = this.authService.getRefreshToken();
    if (token && refreshToken) {
      this.authService.verifyToken(token, refreshToken).subscribe(
        isValid => {
          if (isValid) {
            const decodedToken = this.authService.getDecodedToken();
            if (decodedToken?.role?.includes('admin')) {
              this.router.navigate(['/welcome']);
            } else {
              this.router.navigate(['/welcome']);
            }
          }
        },
        error => {
          
        }
      );
    }
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
          const errorMessage = error.error ? error.error.message : "Something went wrong while logging in";
          this.toastr.error(errorMessage);
          this.loading = false;
        }
      });
    } else {
      this.toastr.error('Invalid Inputs!');

    }

  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}

