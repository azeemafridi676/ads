import { Component, OnInit, OnDestroy, HostListener, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavService } from '../../service/nav.service';
import { LayoutService } from '../../service/layout/layout.service';
import { AuthService } from '../../service/Auth/Auth.service';
import { Subscription } from 'rxjs';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';

import { PermissionService } from '../../service/permissions/permission.service';
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() isSidebarOpen: boolean = true;
  selectedItem: string | null = null;
  footerDark: any;
  footerLight: any;
  footerFix: any;
  Scorlled: any;
  permissions: any;
  isFilter = false;
  permissionLoad = false;
  public currentRoute: string = '/';
  public show: boolean = true;
  public userData: any = {};
  public width = window.innerWidth;
  public screenwidth: any = window.innerWidth;
  private routeSubscription: Subscription = new Subscription();
  activeDropdown: string | null = null;

  constructor(
    public navServices: NavService,
    public route: ActivatedRoute,
    public layout: LayoutService,
    public authService: AuthService,
    private router: Router,
    private permissionService: PermissionService,
    private breakpointObserver: BreakpointObserver
  ) { }

  ngOnInit(): void {
    this.authService.getUserProfileData().subscribe();
    this.permissionService.loadPermissions().subscribe()
    this.authService.getUserDetails().subscribe({
      next: (data) => {
        this.userData = data || {};
      }
    });
    this.routeSubscription = this.router.events.subscribe(event => {
      this.currentRoute = this.router.url;
    });
    this.breakpointObserver
      .observe(['(max-width: 768px)']) // Adjust the breakpoint as needed
      .subscribe((state: BreakpointState) => {
        if (state.matches) {
          this.isSidebarOpen = false;
          this.isFilter = false;
        } else {
          this.isSidebarOpen = true;
          this.isFilter = false;
        }
      });
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  toggleDropdown(dropdownName: string): void {
    this.activeDropdown = this.activeDropdown === dropdownName ? null : dropdownName;
  }

  selectItem(item: string) {
    this.selectedItem = this.selectedItem === item ? null : item;
  }

  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (window.innerWidth >= 1024) { // lg breakpoint
      this.isSidebarOpen = true;
    }
  }
}
