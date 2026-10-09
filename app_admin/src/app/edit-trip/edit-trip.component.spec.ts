import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { EditTripComponent } from './edit-trip.component';
import { TripDataService } from '../services/trip-data.service';
import { trips } from '../data/trips';

describe('EditTripComponent', () => {
  let fixture: ComponentFixture<EditTripComponent>;
  let component: EditTripComponent;
  let service: jasmine.SpyObj<TripDataService>;
  let router: jasmine.SpyObj<Router>;

  const create = (code: string | null = 'GALR261114') => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { snapshot: { paramMap: { get: () => code } } }
    });
    fixture = TestBed.createComponent(EditTripComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj('TripDataService', ['getTrip', 'updateTrip']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    service.getTrip.and.returnValue(of([trips[0]]));
    await TestBed.configureTestingModule({
      imports: [EditTripComponent],
      providers: [{ provide: TripDataService, useValue: service }, { provide: Router, useValue: router }]
    }).compileComponents();
  });

  it('loads the trip named in the URL and fills the form', () => {
    create();
    expect(service.getTrip).toHaveBeenCalledWith('GALR261114');
    expect(component.editForm.value.name).toBe('Gale Reef');
    expect(component.editForm.value.resort).toBe('Emerald Bay, 3 stars');
  });

  it('converts the ISO start date to yyyy-MM-dd for the date input', () => {
    create();
    expect(component.editForm.value.start).toBe('2026-11-14');
  });

  it('saves changes with PUT using the original code, then returns to the listing', () => {
    service.updateTrip.and.returnValue(of(trips[0]));
    create();
    component.editForm.patchValue({ name: 'Gale Reef Deluxe' });
    component.onSubmit();
    const [sent, code] = service.updateTrip.calls.mostRecent().args;
    expect(sent.name).toBe('Gale Reef Deluxe');
    expect((sent as any)._id).toBeUndefined();
    expect(code).toBe('GALR261114');
    expect(router.navigate).toHaveBeenCalledWith(['']);
  });

  it('does not save when a required field is cleared', () => {
    create();
    component.editForm.patchValue({ name: '' });
    component.onSubmit();
    expect(service.updateTrip).not.toHaveBeenCalled();
  });

  it('shows a not-found message when the API returns 404', () => {
    service.getTrip.and.returnValue(throwError(() => ({ status: 404, message: 'nf' })));
    create('NOPE');
    expect(component.errorMessage).toContain('not found');
  });

  it('redirects to the listing when no code is in the URL', () => {
    create(null);
    expect(router.navigate).toHaveBeenCalledWith(['']);
  });
});
