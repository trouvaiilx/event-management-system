// src/app/guards/role.guard.ts

import { inject } from '@angular/core';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export const RoleGuard = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  const currentUser = authService.currentUserValue;

  if (!currentUser) {
    console.log('RoleGuard: No user found, redirecting to login');
    router.navigate(['/login']);
    return false;
  }

  const expectedRole = route.data['role'];
  console.log('RoleGuard: Expected role:', expectedRole, 'User role:', currentUser.role);

  if (currentUser.role === expectedRole) {
    return true;
  }

  // Role not authorized, redirect to appropriate dashboard
  snackBar.open('Access denied. You do not have permission to view this page.', 'Close', {
    duration: 3000,
  });

  console.log('RoleGuard: Access denied, redirecting to user dashboard');

  switch (currentUser.role) {
    case 'ADMIN':
      router.navigate(['/admin/dashboard']);
      break;
    case 'EVENT_ORGANIZER':
      router.navigate(['/organizer/dashboard']);
      break;
    case 'ATTENDEE':
      router.navigate(['/attendee/dashboard']);
      break;
    default:
      router.navigate(['/login']);
  }

  return false;
};
