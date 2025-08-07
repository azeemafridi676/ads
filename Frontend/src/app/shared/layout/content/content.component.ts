import {
  AfterViewInit,
  Component,
  OnInit,
} from '@angular/core';

@Component({
  selector: 'app-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.scss'],  
})
export class ContentComponent  {

  isSidebarOpen = false;
  isFilter = false;

  openSidebar() {
    this.isSidebarOpen = true;
    this.isFilter = true;
  }
  closeSidebar() {
    this.isSidebarOpen = false;
    this.isFilter = false;
  }

}
