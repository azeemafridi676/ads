import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadSelectPageComponent } from './download-select-page.component';

describe('DownloadSelectPageComponent', () => {
  let component: DownloadSelectPageComponent;
  let fixture: ComponentFixture<DownloadSelectPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DownloadSelectPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DownloadSelectPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
