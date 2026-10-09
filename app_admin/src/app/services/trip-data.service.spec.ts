import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TripDataService } from './trip-data.service';
import { trips } from '../data/trips';

// Uses the mock trips in data/trips.ts; no real server is contacted.
describe('TripDataService', () => {
  let service: TripDataService;
  let http: HttpTestingController;
  const base = 'http://localhost:3000/api/trips';

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(TripDataService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('getTrips() issues GET /api/trips and returns the trips', () => {
    service.getTrips().subscribe(r => expect(r.length).toBe(3));
    const req = http.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush(trips);
  });

  it('getTrip() issues GET /api/trips/:code', () => {
    service.getTrip('GALR261114').subscribe(r => expect(r[0].name).toBe('Gale Reef'));
    const req = http.expectOne(`${base}/GALR261114`);
    expect(req.request.method).toBe('GET');
    req.flush([trips[0]]);
  });

  it('addTrip() issues POST /api/trips with the trip as the body', () => {
    service.addTrip(trips[0]).subscribe();
    const req = http.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(trips[0]);
    req.flush(trips[0], { status: 201, statusText: 'Created' });
  });

  it('updateTrip() issues PUT /api/trips/:code', () => {
    service.updateTrip({ ...trips[1], name: 'Renamed' }).subscribe();
    const req = http.expectOne(`${base}/DAWR261215`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.name).toBe('Renamed');
    req.flush(trips[1]);
  });

  it('updateTrip() uses the original code in the URL when the code is changed', () => {
    service.updateTrip({ ...trips[1], code: 'NEWCODE' }, 'DAWR261215').subscribe();
    http.expectOne(`${base}/DAWR261215`).flush(trips[1]);
  });

  it('deleteTrip() issues DELETE /api/trips/:code', () => {
    service.deleteTrip('CLAR270121').subscribe();
    const req = http.expectOne(`${base}/CLAR270121`);
    expect(req.request.method).toBe('DELETE');
    req.flush(trips[2]);
  });
});
