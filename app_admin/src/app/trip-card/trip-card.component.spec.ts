import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TripCardComponent } from './trip-card.component';
import { trips } from '../data/trips';

describe('TripCardComponent', () => {
  let fixture: ComponentFixture<TripCardComponent>;
  let component: TripCardComponent;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    router = jasmine.createSpyObj('Router', ['navigate']);
    await TestBed.configureTestingModule({
      imports: [TripCardComponent],
      providers: [{ provide: Router, useValue: router }]
    }).compileComponents();
    fixture = TestBed.createComponent(TripCardComponent);
    component = fixture.componentInstance;
    component.trip = trips[0];
    fixture.detectChanges();
  });

  it('renders the trip name, resort, price and HTML description', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.card-header')?.textContent).toContain('Gale Reef');
    expect(el.textContent).toContain('Emerald Bay, 3 stars');
    expect(el.textContent).toContain('$799.00');
    expect(el.querySelector('.card-text p')).not.toBeNull();   // description HTML was rendered, not escaped
  });

  it('builds the image path for both "images/reef1.jpg" and "reef1.jpg"', () => {
    expect(component.imageSrc).toBe('assets/images/reef1.jpg');
    component.trip = { ...trips[0], image: 'reef2.jpg' };
    expect(component.imageSrc).toBe('assets/images/reef2.jpg');
  });

  it('Edit button navigates to /edit-trip/:code', () => {
    (fixture.nativeElement.querySelector('.btn-info') as HTMLButtonElement).click();
    expect(router.navigate).toHaveBeenCalledWith(['edit-trip', 'GALR261114']);
  });

  it('Delete button emits deleteRequested with the trip', () => {
    let emitted: any;
    component.deleteRequested.subscribe(t => emitted = t);
    (fixture.nativeElement.querySelector('.btn-outline-danger') as HTMLButtonElement).click();
    expect(emitted).toBe(trips[0]);
  });
});
