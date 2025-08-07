import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LocationMainComponent } from './location-list.component';

describe('LocationMainComponent', () => {
  let component: LocationMainComponent;
  let fixture: ComponentFixture<LocationMainComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LocationMainComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LocationMainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
