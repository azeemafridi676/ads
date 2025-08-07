import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RolesService } from 'src/app/shared/service/roles/roles.service';
import { modalAnimation } from 'src/app/shared/animations/modal.animations';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-roles',
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss'],
  animations: [modalAnimation],
})
export class RolesComponent implements OnInit {
  roles: any[] = [];
  selectedId:string=''
  updatedRoles: { [key: string]: any } = {};
  isVisible = false;
  roleForm: FormGroup;
  loading=false;
  constructor(private roleService: RolesService,private fb: FormBuilder,private toastr:ToastrService) { 
    this.roleForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.roleService.getResources().subscribe({
      next: (response: any) => {
        this.roles = response.data;
        this.initializeUpdatedRoles();
      },
      error: (error: any) => {
        console.error('Error loading roles:', error);
      }
    });
  }
  selectRole(id: string): void {
    if (id!==this.selectedId) {
      this.selectedId=id
    }else[
      this.selectedId=''
    ]
  }
  initializeUpdatedRoles(): void {
    this.roles.forEach(role => {
      this.updatedRoles[role._id] = JSON.parse(JSON.stringify(role.permissions));
    });
  }

  updatePermission(roleId: string, resourceId: string, action: string, event: any): void {
    const checked = event.target.checked;

    const permissionIndex = this.updatedRoles[roleId].findIndex(
      (p: any) => p.resource._id === resourceId
    );

    if (permissionIndex !== -1) {
      this.updatedRoles[roleId][permissionIndex][action] = checked;
    }
  }

  applyChanges(): void {
    const updatedRolesArray = Object.entries(this.updatedRoles).map(([roleId, permissions]) => ({
      roleId,
      permissions
    }));
    this.roleService.updateAllRolesPermissions(updatedRolesArray).subscribe({
      next: (response: any) => {
        console.log('All permissions updated successfully:', response);
        this.loadRoles(); 
      },
      error: (error: any) => {
        console.error('Error updating permissions:', error);
      }
    });
  }
  openModal() {
    this.isVisible = true;
  }

  closeModal() {
    this.isVisible = false;
  }

  onSubmit() {
    if (this.roleForm.valid) {
      this.loading = true;
      this.roleService.createRole(this.roleForm.value).subscribe({
        next: (response: any) => {
          this.toastr.success(response.data.message);
          this.loadRoles();
          this.loading = false;
          this.closeModal(); 
        },
        error: (error: any) => {
          this.toastr.error(error.message || 'Failed to create group');
          this.loading = false;
        },
      });
    } else {
      this.toastr.error('Invalid Inputs!');
    }
  }

}