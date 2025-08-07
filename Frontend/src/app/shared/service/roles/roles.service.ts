import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../Auth/Auth.service';

@Injectable({
    providedIn: 'root'
})
export class RolesService {
    private backendUrl = environment.BACKEND_URL;
    private GET_ALL_ROLES = `${this.backendUrl}/api/roles/get-all-roles/`;
    private UPDATE_ROLE_PERMISSIONS = `${this.backendUrl}/api/roles/update-role-permissions/`;
    private CREATE_ROLE = `${this.backendUrl}/api/roles/create-role`;

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    getResources(): Observable<any> {
        const userId = this.authService.getUserIdFromToken();
        return this.http.get<any>(`${this.GET_ALL_ROLES}${userId}`)
    }
    updateAllRolesPermissions(updatedRoles: any[]): Observable<any> {
        return this.http.post(this.UPDATE_ROLE_PERMISSIONS, { updatedRoles });
    }
    createRole(roleDate: any): Observable<any> {
        return this.http.post(this.CREATE_ROLE, roleDate );
    }
 
}
