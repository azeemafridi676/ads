import { CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/Auth/Auth.service'; 
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { LoggingService } from '../services/logging.service';
@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate  {

  constructor(private authService: AuthService, private router: Router, private loggingService: LoggingService) {}

   canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
      const expectedRoles = route.data['roles'] as Array<string>;
      const token = this.authService.getAccessToken();
      const refreshToken = this.authService.getRefreshToken();
      if (!token || !refreshToken) {
        this.router.navigate(['/login']);
        return of(false); 
        
      }

      return this.authService.verifyToken(token, refreshToken).pipe(
        switchMap(valid  => {
          if (!valid) {
            this.router.navigate(['/login']); 
            return of(false); 
          }
          
          // Get user's roles from auth service
          let hasRole = false;

          const decodedToken = this.authService.getDecodedToken();
          hasRole = expectedRoles.some(role => decodedToken.role.includes(role));
          if (!hasRole) {
            this.authService.logout();
            return of(false);
          }
          
          return of(true); 
          
        }),
        catchError(() => {
          this.authService.logout();
          return of(false); 
        })
      );
  }
}
