import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Trip } from '../models/trip';
import { User } from '../models/user';
import { AuthResponse } from '../models/auth-response';

// All communication with the Express REST API lives here, so components never
// build URLs or call HttpClient themselves.
// The JWT is NOT added here: jwtInterceptor attaches it to every API call.
@Injectable({
  providedIn: 'root'
})
export class TripDataService {
  readonly baseUrl = 'http://localhost:3000/api';
  private tripUrl = `${this.baseUrl}/trips`;

  constructor(private http: HttpClient) {}

  // GET /api/trips - every trip (public)
  getTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(this.tripUrl);
  }

  // GET /api/trips/:tripCode - the API returns an array holding the matching trip (public)
  getTrip(tripCode: string): Observable<Trip[]> {
    return this.http.get<Trip[]>(`${this.tripUrl}/${encodeURIComponent(tripCode)}`);
  }

  // POST /api/trips - add a trip (requires a valid JWT)
  addTrip(formData: Trip): Observable<Trip> {
    return this.http.post<Trip>(this.tripUrl, formData);
  }

  // PUT /api/trips/:tripCode - update the trip with that code (requires a valid JWT)
  updateTrip(formData: Trip, originalCode?: string): Observable<Trip> {
    const code = originalCode ?? formData.code;
    return this.http.put<Trip>(`${this.tripUrl}/${encodeURIComponent(code)}`, formData);
  }

  // DELETE /api/trips/:tripCode - remove the trip with that code (requires a valid JWT)
  deleteTrip(tripCode: string): Observable<Trip> {
    return this.http.delete<Trip>(`${this.tripUrl}/${encodeURIComponent(tripCode)}`);
  }

  // POST /api/login - returns a JWT
  login(user: User, passwd: string): Observable<AuthResponse> {
    return this.handleAuthAPICall('login', user, passwd);
  }

  // POST /api/register - creates the user and returns a JWT
  register(user: User, passwd: string): Observable<AuthResponse> {
    return this.handleAuthAPICall('register', user, passwd);
  }

  // Shared by login and register, which differ only in the endpoint
  private handleAuthAPICall(endpoint: string, user: User, passwd: string): Observable<AuthResponse> {
    const body = { name: user.name, email: user.email, password: passwd };
    return this.http.post<AuthResponse>(`${this.baseUrl}/${endpoint}`, body);
  }
}
