import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TripListingComponent } from './trip-listing.component';
import { TripDataService } from '../services/trip-data.service';
import { trips } from '../data/trips';
import { AuthenticationService } from '../services/authentication.service';

describe('TripListingComponent', () => {
  let fixture: ComponentFixture<TripListingComponent>;
  let service: jasmine.SpyObj<TripDataService>;
  let router: jasmine.SpyObj<Router>;
  let auth: jasmine.SpyObj<AuthenticationService>;

  const create = () => {
    TestBed.overrideComponent(TripListingComponent, {
      set: { providers: [{ provide: TripDataService, useValue: service }] }
    });
    fixture = TestBed.createComponent(TripListingComponent);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj('TripDataService', ['getTrips', 'deleteTrip']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    auth = jasmine.createSpyObj('AuthenticationService', ['isLoggedIn']);
    auth.isLoggedIn.and.returnValue(true);   // default: an admin is logged in
    await TestBed.configureTestingModule({
      imports: [TripListingComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthenticationService, useValue: auth }
      ]
    }).compileComponents();
  });

  it('shows one card per trip returned by the service', () => {
    service.getTrips.and.returnValue(of(trips));
    create();
    expect(fixture.nativeElement.querySelectorAll('app-trip-card').length).toBe(3);
    expect(fixture.componentInstance.message).toBe('There are 3 trips available.');
  });

  it('shows a message when the database has no trips', () => {
    service.getTrips.and.returnValue(of([]));
    create();
    expect(fixture.nativeElement.querySelectorAll('app-trip-card').length).toBe(0);
    expect(fixture.componentInstance.message).toContain('no trips');
  });

  it('shows an error banner when the API is unreachable', () => {
    service.getTrips.and.returnValue(throwError(() => new Error('down')));
    create();
    expect(fixture.nativeElement.querySelector('.alert-danger')?.textContent).toContain('Could not reach');
  });

  it('Add Trip button navigates to /add-trip', () => {
    service.getTrips.and.returnValue(of(trips));
    create();
    (fixture.nativeElement.querySelector('.btn-info') as HTMLButtonElement).click();
    expect(router.navigate).toHaveBeenCalledWith(['add-trip']);
  });

  it('delete: confirmed -> calls the service and reloads the list', () => {
    service.getTrips.and.returnValue(of(trips));
    service.deleteTrip.and.returnValue(of(trips[0]));
    spyOn(window, 'confirm').and.returnValue(true);
    create();
    fixture.componentInstance.onDelete(trips[0]);
    expect(service.deleteTrip).toHaveBeenCalledWith('GALR261114');
    expect(service.getTrips).toHaveBeenCalledTimes(2);
  });

  it('delete: cancelled -> nothing is sent to the API', () => {
    service.getTrips.and.returnValue(of(trips));
    spyOn(window, 'confirm').and.returnValue(false);
    create();
    fixture.componentInstance.onDelete(trips[0]);
    expect(service.deleteTrip).not.toHaveBeenCalled();
  });

  it('shows the Add Trip button when logged in', () => {
    service.getTrips.and.returnValue(of(trips));
    create();
    expect(fixture.nativeElement.querySelector('.btn-info')).not.toBeNull();
  });

  it('hides the Add Trip button when logged out, but still lists the trips', () => {
    auth.isLoggedIn.and.returnValue(false);
    service.getTrips.and.returnValue(of(trips));
    create();
    expect(fixture.nativeElement.querySelector('.btn-info')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('app-trip-card').length).toBe(3);
  });

  it('delete rejected with 401 tells the admin the session expired', () => {
    service.getTrips.and.returnValue(of(trips));
    service.deleteTrip.and.returnValue(throwError(() => ({ status: 401 })));
    spyOn(window, 'confirm').and.returnValue(true);
    create();
    fixture.componentInstance.onDelete(trips[0]);
    expect(fixture.componentInstance.errorMessage).toContain('session has expired');
  });
});
