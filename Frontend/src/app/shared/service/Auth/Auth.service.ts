// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { jwtDecode } from 'jwt-decode'
import { environment } from 'src/environments/environment';
import { SignUpData, LoginData, LoginResponse, SignUpResponse } from '../../model/user.model'; // Adjust the path as needed
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { LoggingService } from '../logging.service';
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private backendUrl = environment.BACKEND_URL;
  private SIGNUP = `${this.backendUrl}/api/user/auth/signup`;
  private PROFILE_DETAIL = `${this.backendUrl}/api/user/profile/detail/`;
  private UPDATE_PROFILE = `${this.backendUrl}/api/user/profile/update-profile`;
  private LOGIN = `${this.backendUrl}/api/user/auth/login`;
  private RESEND_OTP = `${this.backendUrl}/api/user/auth/resend-otp`;
  private VERIFYOTP = `${this.backendUrl}/api/user/auth/verify-otp`;
  private VERIFYTOKEN = `${this.backendUrl}/api/user/auth/verify-token`;
  private FORGETPASSWORD = `${this.backendUrl}/api/user/auth/forgot-password`;
  private REFRESHTOKEN = `${this.backendUrl}/api/user/auth/refresh-token`;
  private RESETPASSWORD = `${this.backendUrl}/api/user/auth/reset-password`;
  private CHANGEPASSWORD = `${this.backendUrl}/api/user/auth/change-password`;
  private LOGOUT = `${this.backendUrl}/api/user/auth/logout`;
  private DELETE_ACCOUNT = `${this.backendUrl}/api/user/profile/delete-account`;
  private GOOGLE_AUTH = `${this.backendUrl}/api/user/auth/google`;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  
  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  constructor( private router: Router ,private http: HttpClient,  private loggingService: LoggingService) {}
  private verificationIdSubject = new BehaviorSubject<string | null>(null);
  private loginData = new BehaviorSubject<string | null>(null);
  private userDetail = new BehaviorSubject<any>(null);
  private readonly SOURCE = 'Auth.service.ts';

  getAuthenticated(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

  setLoginData(data: any): void {
    this.loginData.next(data);
  }
  getLoginData(): Observable<string | null> {
    return this.loginData.asObservable();
  }
  setVerificationId(verificationId: string): void {
    this.verificationIdSubject.next(verificationId);
  }
  getVerificationId(): Observable<string | null> {
    return this.verificationIdSubject.asObservable();
  }
  setUserDetails(data: any): void {
    this.userDetail.next(data);
  }
  getUserDetails(): Observable<any> {
    return this.userDetail.asObservable();
  }
  signUp(userData: SignUpData): Observable<SignUpResponse> {
    this.setLoginData(userData)
    return this.http.post<SignUpResponse>(this.SIGNUP, userData);
  }
  updateProfile(userData: any): Observable<any> {
    return this.http.post<SignUpResponse>(this.UPDATE_PROFILE, userData).pipe(
      tap((response: any) => {
        if (response.data) {
          const currentUser = this.userSubject.getValue();
          const updatedData = {
            ...response.data,
            currentSubscription: currentUser?.currentSubscription || response.data.currentSubscription
          };
          this.userSubject.next(updatedData);
          this.setUserDetails(updatedData);
        }
      })
    );
  }
  getUserProfileData(): Observable<any> {
    const userId = this.getUserIdFromToken();
    if(userId){
      return this.http.get<any>(this.PROFILE_DETAIL + userId).pipe(
        tap((response: any) => {
          const data = response.data;
          this.setUserDetails(data);
          this.userSubject.next(data);
          this.isAuthenticatedSubject.next(true);
        }),
        map((response: any) => response.data) 
      );
    }
    return of(null);
  }
  login(userData: LoginData): Observable<LoginResponse> {
    this.setLoginData(userData)
    return this.http.post<LoginResponse>(this.LOGIN, userData);
  }
  resendOtpCode(): Observable<LoginResponse> {
    return this.getLoginData().pipe(
      switchMap(data => 
        this.http.post<LoginResponse>(this.RESEND_OTP, data)
      )
    );
  }
  forgotPassword(email: string): Observable<void> {
    return this.http.post<void>(this.FORGETPASSWORD, { email });
  }
  resetPassword(token:string,password: string): Observable<void> {
    return this.http.post<void>(this.RESETPASSWORD, { token , password });
  }
  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(this.CHANGEPASSWORD, { currentPassword, newPassword });
  }
  deleteAccount(): Observable<void> {
    return this.http.delete<void>(this.DELETE_ACCOUNT).pipe(
      tap(() => {
        this.clearTokens();
        this.isAuthenticatedSubject.next(false);
        this.userSubject.next(null);
        this.router.navigate(['/login']);
      })
    );
  }
  verifyOtp(otp: string): Observable<any> {
    return this.getVerificationId().pipe(
      switchMap(verificationId => {
        if (verificationId) {
          return this.http.post<any>(this.VERIFYOTP, { verificationId, otp });

        } else {
          throw new Error('Verification ID is not set');
        }
      })
    );
  }
  verifyToken(accessToken: string, refreshToken: string): Observable<boolean> {
    return this.http.post<any>(this.VERIFYTOKEN, { accessToken, refreshToken }).pipe(
      switchMap(response => {
        if (response.data.valid) {
          const prevAuthState = this.isAuthenticatedSubject.value;
          if (response.data.accessToken) {
            this.storeTokens(response.data);
          }
          this.isAuthenticatedSubject.next(true);
          return of(true);
        } else {
          this.logout();
          return of(false);
        }
      }),
      catchError(() => {
        this.logout();
        return of(false);
      })
    );
  }
  logout(): void {
    const userId = this.getUserIdFromToken();
    if (userId) {
    this.http.post<any>(this.LOGOUT, { userId }).pipe(
      tap(() => {
        this.clearTokens();
        this.isAuthenticatedSubject.next(false);
        this.userSubject.next(null);
        this.router.navigate(['/login']);
      }),
      catchError((error) => {
        this.loggingService.log(this.SOURCE, 'Failed to logout', error);
        throw new Error('Failed to logout. Please try again.');
        })
      ).subscribe();
    } else {
      this.loggingService.log(this.SOURCE, 'No user ID found');
    }
  }
  storeTokens(tokens: { accessToken: string; refreshToken: string }): void {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    this.isAuthenticatedSubject.next(true);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }
  getDecodedToken(): any {
    const token = this.getAccessToken();
    if (token) {
      return jwtDecode(token);
    }
    return null;
  }
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }
  refreshToken(refreshToken: string): Observable<any> {
    return this.http.post<any>(this.REFRESHTOKEN, { refreshToken }).pipe(
      tap(response => {
        if (response.data) {
          this.storeTokens(response.data);
          this.isAuthenticatedSubject.next(true);
        } else {
          this.logout();
        }
      })
    );
  }
  getUserIdFromToken(): string | null {
    const token = this.getAccessToken();
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        return decodedToken.userId || null; // Adjust key based on your token structure
      } catch (error) {
        console.error('Failed to decode token:', error);
        return null;
      }
    }
    return null;
  }
  clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // Simple method to clear storage and redirect to login
  clearStorageAndRedirect(): void {
    this.clearTokens();
    this.isAuthenticatedSubject.next(false);
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  getCurrentUserId(): string | null {
    return this.getUserIdFromToken();
  }
  isAdmin(): boolean {
    const user = this.userSubject.getValue();
    return user?.role === 'admin';
  }
  // Helper method to check if token is expired
  private isTokenExpired(token: string): boolean {
    if (!token) return true;
    
    try {
      const decodedToken: any = jwtDecode(token);
      return decodedToken.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
  // Method to handle token refresh
  setupTokenRefresh(): void {
    const token = this.getAccessToken();
    if (token) {
      const decodedToken: any = jwtDecode(token);
      const expiresIn = decodedToken.exp * 1000 - Date.now();
      
      if (expiresIn > 0) {
        setTimeout(() => {
          const refreshToken = this.getRefreshToken();
          if (refreshToken) {
            this.refreshToken(refreshToken).subscribe();
          } else {
            this.logout();
          }
        }, expiresIn - 60000); // Refresh 1 minute before expiration
      }
    }
  }
  // Add Google OAuth methods
  initiateGoogleAuth(purpose: 'login' | 'signup' = 'login'): void {
    this.loggingService.log(this.SOURCE, 'initiateGoogleAuth...', `${this.GOOGLE_AUTH}?purpose=${purpose}`);
    window.location.href = `${this.GOOGLE_AUTH}?purpose=${purpose}`;
  }

  handleGoogleCallback(accessToken: string, refreshToken: string): void {
    // Store tokens and set authenticated state
    this.storeTokens({ accessToken, refreshToken });
    this.isAuthenticatedSubject.next(true);
    this.loggingService.log(this.SOURCE, `handleGoogleCallback... ${accessToken} ${refreshToken}`);
    // Get user profile data and update state
    this.getUserProfileData().subscribe({
      next: (userData) => {
        this.loggingService.log(this.SOURCE, `handleGoogleCallback... userData ${userData}`);
        this.userSubject.next(userData);
        // No need to redirect here as the callback component handles navigation
      },
      error: (error) => {
        this.loggingService.log(this.SOURCE, 'Error getting user data after Google login', error);
        this.clearTokens();
        this.isAuthenticatedSubject.next(false);
      }
    });
  }

  checkAdminStatus(): Observable<boolean> {
    return this.http.get<any>(`${this.backendUrl}/api/user/admin/status`).pipe(
      map(response => response.data.isOnline),
      catchError(error => {
        this.loggingService.log(this.SOURCE, 'Error checking admin status', error);
        return of(false);
      })
    );
  }
}
