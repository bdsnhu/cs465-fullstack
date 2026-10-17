import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from '../services/authentication.service';
import { User } from '../models/user';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  public formError = '';
  public submitting = false;

  credentials = {
    email: '',
    password: ''
  };

  constructor(
    private router: Router,
    private authenticationService: AuthenticationService
  ) {}

  public onLoginSubmit(): void {
    this.formError = '';
    if (!this.credentials.email.trim() || !this.credentials.password) {
      this.formError = 'Email and password are required, please try again';
      return;
    }
    this.doLogin();
  }

  private doLogin(): void {
    const user = { email: this.credentials.email.trim(), name: '' } as User;
    this.submitting = true;
    this.authenticationService.login(user, this.credentials.password).subscribe({
      next: () => {
        this.submitting = false;
        this.credentials.password = '';
        this.router.navigate(['']);
      },
      error: (error: any) => {
        this.submitting = false;
        this.credentials.password = '';
        this.formError = error?.status === 401
          ? 'Incorrect email or password'
          : error?.status === 0
            ? 'Could not reach the Travlr API. Is the Express server running on port 3000?'
            : (error?.error?.message ?? 'Login failed, please try again');
      }
    });
  }
}
