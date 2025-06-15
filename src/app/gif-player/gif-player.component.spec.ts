import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GifPlayerComponent } from './gif-player.component';

describe('GifPlayerComponent', () => {
  let component: GifPlayerComponent;
  let fixture: ComponentFixture<GifPlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GifPlayerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GifPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
