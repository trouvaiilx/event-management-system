// src/app/components/auth/login/login.component.ts

import { Component, OnInit } from '@angular/core';
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

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngOnInit(): void {
    console.log('Login component initialized');

    // Get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '';

    // Redirect if already logged in
    if (this.authService.isLoggedIn()) {
      console.log('Already logged in, redirecting');
      this.redirectToDashboard();
    }
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    console.log('Login form submitted');

    if (this.loginForm.invalid) {
      console.log('Form invalid');
      Object.keys(this.loginForm.controls).forEach((key) => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    const { email, password } = this.loginForm.value;
    console.log('Attempting login for:', email);

    this.authService.login(email, password).subscribe({
      next: (user) => {
        console.log('Login successful, user:', user);
        this.loading = false;

        this.snackBar.open('Login successful!', 'Close', {
          duration: 2000,
          panelClass: ['success-snackbar'],
        });

        // Small delay for snackbar to show
        setTimeout(() => {
          // Check if user must change password
          if (user.mustChangePassword) {
            console.log('User must change password');
            this.router.navigate(['/change-password']);
          } else if (this.returnUrl) {
            console.log('Redirecting to return URL:', this.returnUrl);
            this.router.navigateByUrl(this.returnUrl);
          } else {
            console.log('Redirecting to dashboard');
            this.redirectToDashboard();
          }
        }, 500);
      },
      error: (error) => {
        console.error('Login failed:', error);
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
    console.log('Redirecting to dashboard for role:', user?.role);

    if (!user) {
      console.error('No user found!');
      return;
    }

    switch (user.role) {
      case UserRole.ADMIN:
        console.log('Navigating to /admin/dashboard');
        this.router.navigate(['/admin/dashboard']);
        break;
      case UserRole.EVENT_ORGANIZER:
        console.log('Navigating to /organizer/dashboard');
        this.router.navigate(['/organizer/dashboard']);
        break;
      case UserRole.ATTENDEE:
        console.log('Navigating to /attendee/dashboard');
        this.router.navigate(['/attendee/dashboard']);
        break;
      default:
        console.error('Unknown role, redirecting to login');
        this.router.navigate(['/login']);
    }
  }

  navigateToRegister(): void {
    console.log('Navigating to register');
    this.router.navigate(['/register']);
  }
}
