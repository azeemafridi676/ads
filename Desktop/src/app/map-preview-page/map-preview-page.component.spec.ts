import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapPreviewPageComponent } from './map-preview-page.component';

describe('MapPreviewPageComponent', () => {
  let component: MapPreviewPageComponent;
  let fixture: ComponentFixture<MapPreviewPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapPreviewPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapPreviewPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
