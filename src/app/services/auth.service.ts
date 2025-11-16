// src/app/services/auth.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';
import { User, UserRole } from '../models/models';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  constructor(private storageService: StorageService) {
    const storedUser = this.storageService.get('currentUser');
    console.log('AuthService.constructor: storedUser from storage =', storedUser);
    // Initialize with null if storedUser is undefined, to avoid undefined !== null returning true
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser || null);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    const value = this.currentUserSubject.value;
    console.log('AuthService.currentUserValue: returning', value);
    return value;
  }

  login(email: string, password: string): Observable<User> {
    console.log('Login attempt:', email);

    return of(null).pipe(
      delay(500),
      map(() => {
        const users: User[] = this.storageService.get('users') || [];
        console.log('Available users:', users.length);

        const user = users.find((u) => u.email === email && u.password === password);

        if (!user) {
          console.error('User not found or password incorrect');
          throw new Error('Invalid email or password');
        }

        if (!user.isActive) {
          console.error('User account inactive');
          throw new Error('Account is inactive. Please contact administrator.');
        }

        console.log('Login successful for:', user.email, 'Role:', user.role);

        // Store current user
        this.storageService.set('currentUser', user);
        this.currentUserSubject.next(user);

        return user;
      }),
      catchError((error) => {
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    console.log('Logging out user');
    this.storageService.delete('currentUser');
    this.currentUserSubject.next(null);
  }

  changePassword(userId: string, oldPassword: string, newPassword: string): Observable<boolean> {
    return of(null).pipe(
      delay(300),
      map(() => {
        const users: User[] = this.storageService.get('users') || [];
        const user = users.find((u) => u.id === userId);

        if (!user) {
          throw new Error('User not found');
        }

        if (user.password !== oldPassword) {
          throw new Error('Current password is incorrect');
        }

        // Update password
        const updatedUser = { ...user, password: newPassword, mustChangePassword: false };
        this.storageService.updateInCollection('users', userId, updatedUser);

        // Update current user if logged in
        if (this.currentUserValue?.id === userId) {
          this.storageService.set('currentUser', updatedUser);
          this.currentUserSubject.next(updatedUser);
        }

        return true;
      })
    );
  }

  isLoggedIn(): boolean {
    const result = this.currentUserValue !== null;
    console.log('AuthService.isLoggedIn: currentUserValue is', this.currentUserValue, '→ returning', result);
    return result;
  }

  hasRole(role: UserRole): boolean {
    return this.currentUserValue?.role === role;
  }

  isAdmin(): boolean {
    return this.hasRole(UserRole.ADMIN);
  }

  isEventOrganizer(): boolean {
    return this.hasRole(UserRole.EVENT_ORGANIZER);
  }

  isAttendee(): boolean {
    return this.hasRole(UserRole.ATTENDEE);
  }

  register(userData: Partial<User>): Observable<User> {
    console.log('Register attempt:', userData.email);

    return of(null).pipe(
      delay(500),
      map(() => {
        const users: User[] = this.storageService.get('users') || [];

        // Check if email already exists
        if (users.find((u) => u.email === userData.email)) {
          console.error('Email already registered');
          throw new Error('Email already registered');
        }

        const newUser: User = {
          id: this.generateId('user'),
          email: userData.email!,
          password: userData.password!,
          role: userData.role || UserRole.ATTENDEE,
          fullName: userData.fullName!,
          phoneNumber: userData.phoneNumber!,
          organizationName: userData.organizationName,
          createdAt: new Date(),
          mustChangePassword: false,
          isActive: true,
        };

        this.storageService.addToCollection('users', newUser);
        console.log('Registration successful:', newUser.email);

        return newUser;
      }),
      catchError((error) => {
        console.error('Registration error:', error);
        return throwError(() => error);
      })
    );
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
