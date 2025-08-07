import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { AuthService } from '../../services/Auth/Auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full">
      <!-- Back Button - Updated styling to match theme -->
      <div *ngIf="showBackButton" class="absolute top-4 left-4">
        <button (click)="goBack()" 
                class="flex items-center text-[#eb7641] hover:text-orange-700 bg-white 
                       px-4 py-2 rounded-full transition duration-300 ease-in-out 
                       transform hover:scale-105 border-2 border-[#eb7641] shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span class="font-bold">Back</span>
        </button>
      </div>

      <!-- Window Controls -->
      <div class="absolute top-0 right-0 p-4 flex space-x-2">
        <button 
          (click)="onMinimize()" 
          class="flex items-center space-x-2 text-white hover:text-gray-300 focus:outline-none bg-[#eb7641] hover:bg-orange-700 px-4 py-2 rounded-full transition duration-300 ease-in-out transform hover:scale-105 border-2 border-[#eb7641]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
          </svg>
        </button>
        <button 
          (click)="onClose()" 
          class="flex items-center space-x-2 text-white hover:text-gray-300 focus:outline-none bg-[#eb7641] hover:bg-orange-700 px-4 py-2 rounded-full transition duration-300 ease-in-out transform hover:scale-105 border-2 border-[#eb7641]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Logout Button -->
      <div class="absolute bottom-4 left-4">
        <button 
          (click)="onLogout()" 
          class="flex items-center space-x-2 text-white hover:text-gray-300 focus:outline-none bg-[#eb7641] hover:bg-orange-700 px-6 py-3 rounded-full transition duration-300 ease-in-out transform hover:scale-105 border-2 border-[#eb7641]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </div>
  `,
  styles: []
})
export class NavbarComponent {
  @Input() showBackButton: boolean = false;
  @Output() minimize = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  constructor(
    private location: Location,
    private authService: AuthService
  ) {}

  goBack(): void {
    this.location.back();
  }

  onMinimize(): void {
    this.minimize.emit();
  }

  onClose(): void {
    this.close.emit();
  }

  onLogout(): void {
    this.authService.logout();
  }
} 