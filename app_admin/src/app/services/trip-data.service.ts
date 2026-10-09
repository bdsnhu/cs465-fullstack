import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Trip } from '../models/trip';

// All communication with the Express REST API lives here, so components never
// build URLs or call HttpClient themselves.
@Injectable({
  providedIn: 'root'
})
export class TripDataService {
  private apiBaseUrl = 'http://localhost:3000/api/';
  private tripUrl = `${this.apiBaseUrl}trips`;

  constructor(private http: HttpClient) {}

  // GET /api/trips - every trip
  getTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(this.tripUrl);
  }

  // GET /api/trips/:tripCode - the API returns an array holding the matching trip
  getTrip(tripCode: string): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${this.tripUrl}/${encodeURIComponent(tripCode)}`);
  }

  // POST /api/trips - add a trip
  addTrip(formData: Trip): Observable<Trip> {
    return this.http.post<Trip>(this.tripUrl, formData);
  }

  // PUT /api/trips/:tripCode - update the trip with that code
  updateTrip(formData: Trip, originalCode?: string): Observable<Trip> {
    const code = originalCode ?? formData.code;
    return this.http.put<Trip>(`${this.tripUrl}/${encodeURIComponent(code)}`, formData);
  }

  // DELETE /api/trips/:tripCode - remove the trip with that code
  deleteTrip(tripCode: string): Observable<Trip> {
    return this.http.delete<Trip>(`${this.tripUrl}/${encodeURIComponent(tripCode)}`);
  }
}
