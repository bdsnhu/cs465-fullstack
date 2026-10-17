import { Inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { BROWSER_STORAGE } from '../storage';
import { User } from '../models/user';
import { AuthResponse } from '../models/auth-response';
import { TripDataService } from './trip-data.service';

const TOKEN_KEY = 'travlr-token';

// Owns the JWT: saves it after login/register, reports whether the user is
// logged in, and removes it on logout.
@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  constructor(
    @Inject(BROWSER_STORAGE) private storage: Storage,
    private tripDataService: TripDataService
  ) {}

  // The stored token, or '' when there is none
  public getToken(): string {
    return this.storage.getItem(TOKEN_KEY) ?? '';
  }

  public saveToken(token: string): void {
    this.storage.setItem(TOKEN_KEY, token);
  }

  // Logging out just forgets the token
  public logout(): void {
    this.storage.removeItem(TOKEN_KEY);
  }

  // True only if a well-formed token exists AND it has not expired.
  // (The API is the real gatekeeper; this only drives what the UI shows.)
  public isLoggedIn(): boolean {
    const payload = this.decodePayload(this.getToken());
    return !!payload && typeof payload.exp === 'number' && payload.exp > Date.now() / 1000;
  }

  // Call only after isLoggedIn() has returned true
  public getCurrentUser(): User {
    const payload = this.decodePayload(this.getToken());
    return { email: payload?.email ?? '', name: payload?.name ?? '' } as User;
  }

  // Log in and store the token. The Observable lets the caller react to
  // success or failure (the component shows the error or navigates away).
  public login(user: User, passwd: string): Observable<AuthResponse> {
    return this.tripDataService.login(user, passwd)
      .pipe(tap(resp => this.saveToken(resp.token)));
  }

  public register(user: User, passwd: string): Observable<AuthResponse> {
    return this.tripDataService.register(user, passwd)
      .pipe(tap(resp => this.saveToken(resp.token)));
  }

  // Read the JSON payload from the middle section of the JWT; null if unreadable
  private decodePayload(token: string): any {
    if (!token) { return null; }
    try {
      const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(b64));
    } catch {
      return null;
    }
  }
}
