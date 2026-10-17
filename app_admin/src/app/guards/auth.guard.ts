import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthenticationService } from '../services/authentication.service';

// Keeps logged-out visitors off the add/edit pages (typing the URL directly
// sends them to the login form instead).
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthenticationService);
  const router = inject(Router);
  return auth.isLoggedIn() ? true : router.createUrlTree(['login']);
};
