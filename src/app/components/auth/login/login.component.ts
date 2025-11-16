// src/app/components/auth/login/login.component.ts

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth.service';
import { UserRole } from '../../../models/models';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  loading = false;
  hidePassword = true;
  returnUrl: string = '';

  private formBuilder = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  constructor() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    // Get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '';

    console.log('LoginComponent.ngOnInit: isLoggedIn =', this.authService.isLoggedIn());

    // If already logged in, hide the login UI and redirect
    if (this.authService.isLoggedIn()) {
      console.log('LoginComponent: User is logged in, hiding login container and redirecting');
      // Hide the login container element to prevent it from overlaying other components
      const loginContainer = document.querySelector('.login-container') as HTMLElement;
      if (loginContainer) {
        loginContainer.style.display = 'none';
        console.log('LoginComponent: Hidden login container');
      } else {
        console.warn('LoginComponent: login container not found in DOM');
      }
      this.redirectToDashboard();
    } else {
      console.log('LoginComponent: User not logged in, login form will display');
    }
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    const { email, password } = this.loginForm.value;

    // Safety timeout: if navigation doesn't complete in 5 seconds, unblock loading
    const navigationTimeout = setTimeout(() => {
      console.error('LoginComponent: Navigation timeout - forcing loading = false');
      this.loading = false;
    }, 5000);

    this.authService.login(email, password).subscribe({
      next: (user) => {
        clearTimeout(navigationTimeout);
        this.snackBar.open('Login successful!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });

        // stop loading spinner before navigation
        this.loading = false;

        console.log('LoginComponent.onSubmit: login success, hiding login container');
        // Hide the login container so dashboard can show
        const loginContainer = document.querySelector('.login-container') as HTMLElement;
        if (loginContainer) {
          loginContainer.style.display = 'none';
        }

        // Check if user must change password
        if (user.mustChangePassword) {
          this.router.navigate(['/change-password']);
        } else if (this.returnUrl) {
          this.router.navigateByUrl(this.returnUrl);
        } else {
          this.redirectToDashboard();
        }
      },
      error: (error) => {
        clearTimeout(navigationTimeout);
        this.loading = false;
        this.snackBar.open(error.message || 'Login failed. Please try again.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  private redirectToDashboard(): void {
    const user = this.authService.currentUserValue;
    console.log('LoginComponent.redirectToDashboard: currentUser =', user);
    if (!user) {
      console.error('LoginComponent.redirectToDashboard: no user, cannot redirect');
      return;
    }
    console.log('LoginComponent.redirectToDashboard: user role =', user.role);
    switch (user.role) {
      case UserRole.ADMIN:
        console.log('LoginComponent: calling router.navigate([/admin/dashboard])');
        this.router.navigate(['/admin/dashboard']);
        break;
      case UserRole.EVENT_ORGANIZER:
        console.log('LoginComponent: calling router.navigate([/organizer/dashboard])');
        this.router.navigate(['/organizer/dashboard']);
        break;
      case UserRole.ATTENDEE:
        console.log('LoginComponent: calling router.navigate([/attendee/dashboard])');
        this.router.navigate(['/attendee/dashboard']);
        break;
      default:
        console.log('LoginComponent: unknown role, calling router.navigate([/login])');
        this.router.navigate(['/login']);
    }
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }
}
