import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ExternalComponent } from './external.component';

const routes: Routes = [
  { path: '', component: ExternalComponent }
];

@NgModule({
  declarations: [ExternalComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class ExternalModule { } 