import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AddTripComponent } from './add-trip.component';
import { TripDataService } from '../services/trip-data.service';

describe('AddTripComponent', () => {
  let fixture: ComponentFixture<AddTripComponent>;
  let component: AddTripComponent;
  let service: jasmine.SpyObj<TripDataService>;
  let router: jasmine.SpyObj<Router>;

  const valid = {
    code: 'TESTR270301', name: 'Test Reef', length: '3 nights / 4 days', start: '2027-03-01',
    resort: 'Test Bay, 3 stars', perPerson: '599.00', image: 'reef3.jpg', description: '<p>Test</p>'
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj('TripDataService', ['addTrip']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    await TestBed.configureTestingModule({
      imports: [AddTripComponent],
      providers: [{ provide: TripDataService, useValue: service }, { provide: Router, useValue: router }]
    }).compileComponents();
    fixture = TestBed.createComponent(AddTripComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('does not call the API when required fields are empty', () => {
    component.onSubmit();
    fixture.detectChanges();
    expect(service.addTrip).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Trip Code is required');
  });

  it('rejects a non-numeric price', () => {
    component.addForm.patchValue({ ...valid, perPerson: 'cheap' });
    component.onSubmit();
    expect(service.addTrip).not.toHaveBeenCalled();
  });

  it('posts a valid trip (without _id) and returns to the listing', () => {
    service.addTrip.and.returnValue(of(valid as any));
    component.addForm.patchValue(valid);
    component.onSubmit();
    expect(service.addTrip).toHaveBeenCalledWith(valid as any);
    expect(router.navigate).toHaveBeenCalledWith(['']);
  });

  it('shows the API error (e.g. duplicate code) and stays on the form', () => {
    service.addTrip.and.returnValue(throwError(() => ({ error: { message: "Trip with code 'X' already exists" } })));
    component.addForm.patchValue(valid);
    component.onSubmit();
    fixture.detectChanges();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.alert-danger')?.textContent).toContain('already exists');
  });
});
