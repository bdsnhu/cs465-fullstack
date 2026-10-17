import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { NavbarComponent } from './navbar.component';
import { AuthenticationService } from '../services/authentication.service';

describe('NavbarComponent', () => {
  let fixture: ComponentFixture<NavbarComponent>;
  let auth: jasmine.SpyObj<AuthenticationService>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj('AuthenticationService', ['isLoggedIn', 'getCurrentUser', 'logout']);
    auth.getCurrentUser.and.returnValue({ email: 'a@b.c', name: 'Ann' });
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [provideRouter([]), { provide: AuthenticationService, useValue: auth }]
    }).compileComponents();
    fixture = TestBed.createComponent(NavbarComponent);
  });

  it('logged out: shows Log In, no Log Out', () => {
    auth.isLoggedIn.and.returnValue(false);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.login-link')?.textContent).toContain('Log In');
    expect(el.querySelector('.logout-link')).toBeNull();
    expect(el.querySelector('.navbar-brand')?.textContent).toContain('Travlr Getaways Admin');
  });

  it('logged in: shows the user name and Log Out, no Log In', () => {
    auth.isLoggedIn.and.returnValue(true);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.login-link')).toBeNull();
    expect(el.querySelector('.logout-link')?.textContent).toContain('Log Out');
    expect(el.querySelector('.user-name')?.textContent).toContain('Ann');
  });

  it('Log Out clears the token and returns to the listing', () => {
    auth.isLoggedIn.and.returnValue(true);
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.logout-link') as HTMLButtonElement).click();
    expect(auth.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['']);
  });
});
