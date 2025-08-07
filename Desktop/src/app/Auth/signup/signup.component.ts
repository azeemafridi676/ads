import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../shared/services/Auth/Auth.service';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { MustMatch, nameValidator, sqlInjectionValidator } from '../../shared/validators/formValidator';
import { LoggingService } from '../../shared/services/logging.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { SpinnerComponent } from '../../shared/components/spinner/spinner.component';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SpinnerComponent,
    RouterLink
  ]
})
export class SignupComponent implements OnInit {
  signupForm: FormGroup;
  loading = false;
  showPassword = false;
  showConfirmPassword = false;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router, public toastr: ToastrService, private loggingService: LoggingService) {
    this.signupForm = this.fb.group({
      firstName: ['', [Validators.required, nameValidator(), sqlInjectionValidator()]],
      lastName: ['', [Validators.required, nameValidator(), sqlInjectionValidator()]],
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
      privacyPolicy: [false, Validators.requiredTrue]
    }, {
      validator: MustMatch('password', 'confirmPassword')
    });
  }

  ngOnInit(): void {
  }

  onSubmit(): void {
    if (this.signupForm.valid) {
      this.loading = true;
      this.authService.signUp(this.signupForm.value).subscribe({
        next: (response: any) => {
          this.toastr.success(response.message);
          this.authService.setVerificationId(response.data.verificationId)
          this.loading = false;
          this.router.navigate(['/otp'])
        },
        error: (error: any) => {
          let errorMessage = "Something went wrong while signing up!";
          if (error.error) {
            errorMessage = (typeof error.message == 'string') ? error.message : error.error.message;
          }
          if(typeof error  == 'string'){
            errorMessage = error;
          }
          this.loading = false;
          this.toastr.error(errorMessage);
        }
      });
    } else {
      this.signupForm.markAsDirty();
      this.signupForm.markAllAsTouched();
      // this.toastr.error('Invalid Inputs!');
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}
