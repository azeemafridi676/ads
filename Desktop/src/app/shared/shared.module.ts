import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { GobackComponent } from './components/goback/goback.component';

@NgModule({
  imports: [
    CommonModule,
    SpinnerComponent,
    GobackComponent
  ],
  exports: [
    SpinnerComponent,
    GobackComponent
  ]
})
export class SharedModule {} 