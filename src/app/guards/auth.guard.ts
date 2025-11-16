// src/app/guards/auth.guard.ts

import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AuthGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    console.log('AuthGuard: User is logged in');
    return true;
  }

  console.log('AuthGuard: User not logged in, redirecting to login');
  router.navigate(['/login']);
  return false;
};
