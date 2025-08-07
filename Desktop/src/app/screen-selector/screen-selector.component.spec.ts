import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScreenSelectorComponent } from './screen-selector.component';

describe('ScreenSelectorComponent', () => {
  let component: ScreenSelectorComponent;
  let fixture: ComponentFixture<ScreenSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScreenSelectorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScreenSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
