import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { jwtInterceptor } from './jwt.interceptor';
import { AuthenticationService } from '../services/authentication.service';

describe('jwtInterceptor', () => {
  let http: HttpClient;
  let ctrl: HttpTestingController;
  let auth: jasmine.SpyObj<AuthenticationService>;

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthenticationService', ['isLoggedIn', 'getToken']);
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthenticationService, useValue: auth },
        provideHttpClient(withInterceptors([jwtInterceptor])),
        provideHttpClientTesting()
      ]
    });
    http = TestBed.inject(HttpClient);
    ctrl = TestBed.inject(HttpTestingController);
  });
  afterEach(() => ctrl.verify());

  it('adds the Bearer token to API calls when logged in', () => {
    auth.isLoggedIn.and.returnValue(true);
    auth.getToken.and.returnValue('abc.def.ghi');
    http.put('http://localhost:3000/api/trips/X', {}).subscribe();
    const req = ctrl.expectOne('http://localhost:3000/api/trips/X');
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc.def.ghi');
    req.flush({});
  });

  it('sends no Authorization header when logged out', () => {
    auth.isLoggedIn.and.returnValue(false);
    http.get('http://localhost:3000/api/trips').subscribe();
    const req = ctrl.expectOne('http://localhost:3000/api/trips');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  it('never attaches the token to login or register', () => {
    auth.isLoggedIn.and.returnValue(true);
    auth.getToken.and.returnValue('abc.def.ghi');
    http.post('http://localhost:3000/api/login', {}).subscribe();
    http.post('http://localhost:3000/api/register', {}).subscribe();
    ctrl.expectOne('http://localhost:3000/api/login').flush({});
    const reg = ctrl.expectOne('http://localhost:3000/api/register');
    expect(reg.request.headers.has('Authorization')).toBeFalse();
    reg.flush({});
  });

  it('does not leak the token to other hosts', () => {
    auth.isLoggedIn.and.returnValue(true);
    auth.getToken.and.returnValue('abc.def.ghi');
    http.get('https://example.com/data').subscribe();
    const req = ctrl.expectOne('https://example.com/data');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });
});
