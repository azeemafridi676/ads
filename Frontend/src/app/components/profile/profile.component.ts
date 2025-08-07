import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/shared/service/Auth/Auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Toast, ToastrService } from 'ngx-toastr';
import { NavService } from 'src/app/shared/service/navbar/nav.service';
import { Router } from '@angular/router';
import { SocketService } from 'src/app/shared/service/socket/socket.service';
import { LoggingService } from 'src/app/shared/service/logging.service';
@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  userData: any;
  profileBinaryFile:any;
  loading=false;
  showPasswordModal=false;
  showDeleteModal=false;
  SOURCE = 'profile.component.ts';
  lastUpdateDate: string = '';
  constructor(private authService: AuthService, private fb: FormBuilder,public toastr:ToastrService, private navService: NavService, private router: Router, private socketService: SocketService, private loggingService: LoggingService) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      Dob: [''],
      phoneNumber: ['', Validators.required],
      profileImage: [File],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, {
      validator: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(g: FormGroup) {
    const newPassword = g.get('newPassword')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : {'mismatch': true};
  }

  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  }

  formatLastUpdateDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  }

  ngOnInit(): void {
    this.navService.setTitle('Settings');
    this.navService.setSubtitle('Manage your account settings');
    this.authService.getUserDetails().subscribe({
      next: (data: any) => {
        if (data) {
          this.userData = data;
          this.lastUpdateDate = this.formatLastUpdateDate(data.updatedAt);
          this.profileForm.patchValue({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phoneNumber: data.phoneNumber,
            Dob: this.formatDateForInput(data.Dob),
            profileImage: data.profileImage
          });
        }
      }
    });
  }
  logout() {
    try {
      
      // Then perform auth logout which will handle navigation
      this.authService.logout();
      
    } catch (error) {
      this.loggingService.log(this.SOURCE, 'Error in logout', error);
      this.toastr.error('Something went wrong while logging out');
    }
  }
  openFileSelect(): void {
    const file = document.getElementById("profileImage")
    file?.click();
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.files?.length) {
      const file = input.files[0];
      this.profileBinaryFile=file;
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.userData.profileImage = e.target?.result;
      };
      reader.readAsDataURL(file);
      this.profileForm.patchValue({
        profileImage: file
      });
    }
  }
  onSave(): void {
    this.loading = true;
    const formData = new FormData();
    const _id: any = this.authService.getUserIdFromToken();
    formData.append('firstName', this.profileForm.get('firstName')?.value);
    formData.append('lastName', this.profileForm.get('lastName')?.value);
    formData.append('email', this.profileForm.get('email')?.value);
    
    const dobValue = this.profileForm.get('Dob')?.value;
    if (dobValue) {
      // Ensure the date is in ISO format
      const date = new Date(dobValue);
      if (!isNaN(date.getTime())) {
        formData.append('Dob', date.toISOString());
      }
    } else {
      formData.append('Dob', '');
    }
    
    formData.append('phoneNumber', this.profileForm.get('phoneNumber')?.value);
    formData.append('_id', _id);
    if (this.profileBinaryFile) {
      formData.append('profileImage', this.profileBinaryFile);
    }
    
    this.authService.updateProfile(formData).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.data) {
          // Update the form with the new data
          this.userData = res.data;
          this.profileForm.patchValue({
            Dob: this.formatDateForInput(res.data.Dob)
          });
        }
        this.toastr.success("Profile Updated Successfully");
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error("Something went wrong.");
      }
    });
  }

  openChangePasswordModal(): void {
    this.showPasswordModal = true;
    this.passwordForm.reset();
  }

  closeChangePasswordModal(): void {
    this.showPasswordModal = false;
    this.passwordForm.reset();
  }

  onChangePassword(): void {
    if (this.passwordForm.valid) {
      this.loading = true;
      const { currentPassword, newPassword } = this.passwordForm.value;
      
      this.authService.changePassword(currentPassword, newPassword).subscribe({
        next: () => {
          this.loading = false;
          this.toastr.success('Password changed successfully');
          this.closeChangePasswordModal();
        },
        error: (err) => {
          this.loading = false;
          this.toastr.error(err.error.message || 'Failed to change password');
        }
      });
    }
  }

  openDeleteAccountModal(): void {
    this.showDeleteModal = true;
  }

  closeDeleteAccountModal(): void {
    this.showDeleteModal = false;
  }

  deleteAccount(): void {
    this.loading = true;
    this.authService.deleteAccount().subscribe({
      next: () => {
        this.toastr.success('Your account has been deleted successfully');
        this.loading = false;
        this.closeDeleteAccountModal();
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.toastr.error(error.error.message || 'Failed to delete account');
        this.loading = false;
      }
    });
  }
}
