import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FourohfourComponent } from './fourohfour.component';

describe('FourohfourComponent', () => {
  let component: FourohfourComponent;
  let fixture: ComponentFixture<FourohfourComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FourohfourComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FourohfourComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
