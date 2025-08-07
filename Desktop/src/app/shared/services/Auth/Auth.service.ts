// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { jwtDecode } from 'jwt-decode'
import { environment } from '../../../../environments/environment';
import { SignUpData, LoginData, LoginResponse, SignUpResponse } from '../../model/user.model'; // Adjust the path as needed
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { LoggingService } from '../../services/logging.service';
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

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  
  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  constructor( private router: Router ,private http: HttpClient, private loggingService: LoggingService) {}
  private verificationIdSubject = new BehaviorSubject<string | null>(null);
  private loginData = new BehaviorSubject<string | null>(null);
  private userDetail = new BehaviorSubject<any>(null);
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
    return this.http.post<SignUpResponse>(this.UPDATE_PROFILE, userData);
  }
  getUserProfileData(): Observable<any> {
    const userId = this.getUserIdFromToken();
    return this.http.get<any>(this.PROFILE_DETAIL + userId).pipe(
      tap((response: any) => {
        this.setUserDetails(response.data);
        this.userSubject.next(response.data);
        this.isAuthenticatedSubject.next(true);
      }),
      map((response: any) => response.data) 
    );
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
    if (!accessToken || !refreshToken) {
      return of(false);
    }
    return this.http.post<any>(this.VERIFYTOKEN, {
      accessToken,
      refreshToken
    }).pipe(
      map(response => {
        if (!response) {
          return false;
        }
        if (response.data?.valid === true) {
          this.storeTokens({ accessToken, refreshToken });
          this.isAuthenticatedSubject.next(true);
          return true;
        }
        this.clearTokens();
        this.isAuthenticatedSubject.next(false);
        return false;
      }),
      catchError(error => {
        this.clearTokens();
        this.isAuthenticatedSubject.next(false);
        return of(false);
      })
    );
  }
  logout(): void {
    this.clearTokens();
    this.isAuthenticatedSubject.next(false);
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }
  storeTokens(tokens: { accessToken: string; refreshToken: string }): void {
    if (!tokens.accessToken || !tokens.refreshToken) {
      return;
    }
    localStorage.setItem('access_token', tokens.accessToken);
    localStorage.setItem('refresh_token', tokens.refreshToken);
    this.isAuthenticatedSubject.next(true);
  }

  getAccessToken(): string | null {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return null;
    }
    return token;
  }
  getDecodedToken(): any {
    const token = this.getAccessToken();
    if (!token) {
      return null;
    }
    return jwtDecode(token);
  }
  getRefreshToken(): string | null {
    const token = localStorage.getItem('refresh_token');
    if (!token) {
      return null;
    }
    return token;
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
      } catch (error: any) {
        alert(`Failed to decode token: ${error}`);
        return null;
      }
    }
    return null;
  }
  clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
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
}
