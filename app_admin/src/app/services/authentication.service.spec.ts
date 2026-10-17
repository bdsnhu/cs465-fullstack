import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthenticationService } from './authentication.service';
import { BROWSER_STORAGE } from '../storage';
import { User } from '../models/user';

// Builds an unsigned-looking JWT whose payload we control (the SPA only reads the payload)
const makeToken = (payload: object) =>
  `header.${btoa(JSON.stringify(payload))}.signature`;
const inAnHour = () => Math.floor(Date.now() / 1000) + 3600;

describe('AuthenticationService', () => {
  let auth: AuthenticationService;
  let http: HttpTestingController;
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    const fakeStorage = {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => { store[k] = v; },
      removeItem: (k: string) => { delete store[k]; }
    } as unknown as Storage;
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: BROWSER_STORAGE, useValue: fakeStorage }]
    });
    auth = TestBed.inject(AuthenticationService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('is logged out when there is no token', () => {
    expect(auth.getToken()).toBe('');
    expect(auth.isLoggedIn()).toBeFalse();
  });

  it('is logged in with an unexpired token and exposes the user', () => {
    auth.saveToken(makeToken({ email: 'a@b.c', name: 'Ann', exp: inAnHour() }));
    expect(auth.isLoggedIn()).toBeTrue();
    expect(auth.getCurrentUser()).toEqual({ email: 'a@b.c', name: 'Ann' } as User);
  });

  it('is logged out when the token has expired', () => {
    auth.saveToken(makeToken({ email: 'a@b.c', exp: Math.floor(Date.now() / 1000) - 10 }));
    expect(auth.isLoggedIn()).toBeFalse();
  });

  it('is logged out (no exception) when the stored token is garbage', () => {
    auth.saveToken('not-a-jwt');
    expect(auth.isLoggedIn()).toBeFalse();
    auth.saveToken('a.%%%.c');
    expect(auth.isLoggedIn()).toBeFalse();
  });

  it('logout() removes the token', () => {
    auth.saveToken(makeToken({ exp: inAnHour() }));
    auth.logout();
    expect(auth.getToken()).toBe('');
    expect(auth.isLoggedIn()).toBeFalse();
  });

  it('login() posts the credentials and stores the returned token', () => {
    const token = makeToken({ email: 'a@b.c', name: 'Ann', exp: inAnHour() });
    auth.login({ email: 'a@b.c', name: '' } as User, 'secret123').subscribe();
    const req = http.expectOne('http://localhost:3000/api/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.email).toBe('a@b.c');
    expect(req.request.body.password).toBe('secret123');
    req.flush({ token });
    expect(auth.getToken()).toBe(token);
    expect(auth.isLoggedIn()).toBeTrue();
  });

  it('a failed login (401) stores nothing and the error reaches the caller', () => {
    let status = 0;
    auth.login({ email: 'a@b.c', name: '' } as User, 'wrong').subscribe({ error: e => status = e.status });
    http.expectOne('http://localhost:3000/api/login')
      .flush({ message: 'Incorrect email or password.' }, { status: 401, statusText: 'Unauthorized' });
    expect(status).toBe(401);
    expect(auth.isLoggedIn()).toBeFalse();
  });
});
