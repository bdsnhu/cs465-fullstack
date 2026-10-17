import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthenticationService } from '../services/authentication.service';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let auth: jasmine.SpyObj<AuthenticationService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj('AuthenticationService', ['login']);
    router = jasmine.createSpyObj('Router', ['navigate']);
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthenticationService, useValue: auth },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders an email field, a password field and a Sign In button', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('input[type=email]')).not.toBeNull();
    expect(el.querySelector('input[type=password]')).not.toBeNull();
    expect(el.querySelector('button[type=submit]')?.textContent).toContain('Sign In');
  });

  it('does not call the API when a field is empty', () => {
    component.credentials = { email: '', password: 'x' };
    component.onLoginSubmit();
    component.credentials = { email: 'a@b.c', password: '' };
    component.onLoginSubmit();
    expect(auth.login).not.toHaveBeenCalled();
    expect(component.formError).toContain('required');
  });

  it('on success navigates to the trip listing', () => {
    auth.login.and.returnValue(of({ token: 't' }));
    component.credentials = { email: 'a@b.c', password: 'secret123' };
    component.onLoginSubmit();
    expect(auth.login).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['']);
    expect(component.formError).toBe('');
  });

  it('a 401 shows "Incorrect email or password", stays on the page and clears the password', () => {
    auth.login.and.returnValue(throwError(() => ({ status: 401 })));
    component.credentials = { email: 'a@b.c', password: 'wrong' };
    component.onLoginSubmit();
    fixture.detectChanges();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.credentials.password).toBe('');
    expect(fixture.nativeElement.querySelector('.alert-danger')?.textContent).toContain('Incorrect email or password');
  });

  it('a network failure (status 0) says the API is unreachable', () => {
    auth.login.and.returnValue(throwError(() => ({ status: 0 })));
    component.credentials = { email: 'a@b.c', password: 'x' };
    component.onLoginSubmit();
    expect(component.formError).toContain('Could not reach');
  });
});
