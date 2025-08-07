import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/shared/service/Auth/Auth.service';
@Component({
  selector: 'app-forget-password',
  templateUrl: './forget-password.component.html',
  styleUrl: './forget-password.component.scss'
})
export class ForgetPasswordComponent {
  forgotPasswordForm: FormGroup;
  loading: boolean = false;
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastr:ToastrService
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {

    if (this.forgotPasswordForm.valid) {
      this.loading = true;
      const email = this.forgotPasswordForm.value.email;

      this.authService.forgotPassword(email).subscribe({
        next: (res:any) => {
          this.toastr.success(res.message);
          this.forgotPasswordForm.reset();
          this.loading = false;
        },
        error: (error:any) => { 
          this.toastr.error(error.error.message);
        }
      });
    }
  }

}
