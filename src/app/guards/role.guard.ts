// src/app/guards/role.guard.ts

import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const currentUser = this.authService.currentUserValue;

    if (!currentUser) {
      this.router.navigate(['/login']);
      return false;
    }

    const expectedRole = route.data['role'];

    if (currentUser.role === expectedRole) {
      return true;
    }

    // Role not authorized, redirect to appropriate dashboard
    this.snackBar.open('Access denied. You do not have permission to view this page.', 'Close', {
      duration: 3000,
    });

    switch (currentUser.role) {
      case 'ADMIN':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'EVENT_ORGANIZER':
        this.router.navigate(['/organizer/dashboard']);
        break;
      case 'ATTENDEE':
        this.router.navigate(['/attendee/dashboard']);
        break;
      default:
        this.router.navigate(['/login']);
    }

    return false;
  }
}
