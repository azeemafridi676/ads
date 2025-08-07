import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadStatusPageComponent } from './download-status-page.component';

describe('DownloadStatusPageComponent', () => {
  let component: DownloadStatusPageComponent;
  let fixture: ComponentFixture<DownloadStatusPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DownloadStatusPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DownloadStatusPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
