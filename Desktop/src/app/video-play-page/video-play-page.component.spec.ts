import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoPlayPageComponent } from './video-play-page.component';

describe('VideoPlayPageComponent', () => {
  let component: VideoPlayPageComponent;
  let fixture: ComponentFixture<VideoPlayPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VideoPlayPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VideoPlayPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
