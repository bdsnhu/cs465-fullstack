import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthenticationService } from '../services/authentication.service';
import { TripDataService } from '../services/trip-data.service';

// Adds  Authorization: Bearer <token>  to every request that goes to our API,
// except login/register (which are how the token is obtained). One place to do
// it, so no individual service call has to remember.
export const jwtInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthenticationService);
  const apiBase = inject(TripDataService).baseUrl;

  const isAuthAPI = request.url === `${apiBase}/login` || request.url === `${apiBase}/register`;
  const isOurAPI = request.url.startsWith(apiBase);

  if (isOurAPI && !isAuthAPI && auth.isLoggedIn()) {
    return next(request.clone({
      setHeaders: { Authorization: `Bearer ${auth.getToken()}` }
    }));
  }
  return next(request);
};
