import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthenticationService } from '../services/authentication.service';

describe('authGuard', () => {
  let auth: jasmine.SpyObj<AuthenticationService>;

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthenticationService', ['isLoggedIn']);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthenticationService, useValue: auth }]
    });
  });

  const run = () => TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));

  it('allows navigation when logged in', () => {
    auth.isLoggedIn.and.returnValue(true);
    expect(run()).toBeTrue();
  });

  it('redirects to /login when logged out', () => {
    auth.isLoggedIn.and.returnValue(false);
    const result = run() as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/login');
  });
});
