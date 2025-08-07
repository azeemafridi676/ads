import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-goback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button (click)="goBack()" class="flex items-center text-gray-600 hover:text-gray-800">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Back
    </button>
  `
})
export class GobackComponent {
  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }
}