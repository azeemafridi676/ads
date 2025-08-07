import { Injectable } from '@angular/core';
import { NgxPermissionsService } from 'ngx-permissions';
import { Observable, of } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { AuthService } from '../Auth/Auth.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  constructor(
    private permissionsService: NgxPermissionsService,
    private authService: AuthService
  ) { }

  // Method to load permissions based on user role
  loadPermissions(): Observable<any> {
    return this.authService.getUserProfileData().pipe(
      tap(userData => {
        if (userData) {
          const role = userData.role || 'user';
          const permissions = [role]; 
          
          this.permissionsService.loadPermissions(permissions);
        }
      }),
      catchError(error => {
        console.error('Error loading permissions:', error);
        return of(null);
      })
    );
  }

  // Method to check if user has admin role
  isAdmin(): boolean {
    return this.permissionsService.getPermission('admin') !== null;
  }

  // Method to check if user has user role
  isUser(): boolean {
    return this.permissionsService.getPermission('user') !== null;
  }
}
