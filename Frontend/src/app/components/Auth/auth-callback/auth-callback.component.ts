import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/shared/service/Auth/Auth.service';
import { LoggingService } from 'src/app/shared/service/logging.service';

@Component({
  selector: 'app-auth-callback',
  templateUrl: './auth-callback.component.html'
})
export class AuthCallbackComponent implements OnInit {
  private readonly SOURCE = 'auth-callback.component.ts';
  error: string | null = null;
  userData: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private loggingService: LoggingService
  ) {}

  ngOnInit() {
    this.loggingService.log(this.SOURCE, 'auth-callback component is initialized');
    this.route.queryParams.subscribe(params => {
      const accessToken = params['accessToken'];
      const refreshToken = params['refreshToken'];
      const error = params['error'];

      if (error) {
        this.error = error;
        if (error === 'notfound') {
          this.userData = {
            email: params['email'],
            firstName: params['firstName'],
            lastName: params['lastName'],
            profileImage: params['profileImage']
          };
        }
        return;
      }

      if (accessToken && refreshToken) {
        this.authService.handleGoogleCallback(accessToken, refreshToken);
        const user = this.authService.getDecodedToken();
        if (user?.role === 'admin') {
          this.router.navigate(['/dashboard/admin']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  goToSignup() {
    if (this.userData) {
      // Navigate to signup with the Google data
      this.router.navigate(['/signup'], { 
        queryParams: {
          email: this.userData.email,
          firstName: this.userData.firstName,
          lastName: this.userData.lastName,
          profileImage: this.userData.profileImage,
          fromGoogle: 'true'
        }
      });
    } else {
      this.router.navigate(['/signup']);
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
} 