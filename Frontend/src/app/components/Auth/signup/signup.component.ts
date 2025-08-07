import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from 'src/app/shared/service/Auth/Auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { MustMatch, nameValidator, sqlInjectionValidator } from 'src/app/shared/validators/formValidator';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent implements OnInit {
  signupForm: FormGroup;
  loading = false;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder, 
    private authService: AuthService, 
    private router: Router, 
    private route: ActivatedRoute,
    public toastr: ToastrService
  ) {
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
    // Check for Google signup data
    this.route.queryParams.subscribe(params => {
      if (params['fromGoogle'] === 'true') {
        this.signupForm.patchValue({
          email: params['email'] || '',
          firstName: params['firstName'] || '',
          lastName: params['lastName'] || ''
        });
      }
    });
  }

  onSubmit(): void {
    if (this.signupForm.valid) {
      this.loading = true;
      this.authService.signUp(this.signupForm.value).subscribe({
        next: (response: any) => {
          console.log("Response received ", response);
          this.toastr.success(response.message);
          this.authService.setVerificationId(response.data.verificationId)
          this.loading = false;
          this.router.navigate(['/otp'])
        },
        error: (error: any) => {
          let errorMessage = "Something went wrong while signing up!";
          console.log("Error while signing up:", error);
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
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  signupWithGoogle(): void {
    // Add a parameter to indicate this is for signup
    this.authService.initiateGoogleAuth('signup');
  }
}
