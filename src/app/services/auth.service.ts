// src/app/services/auth.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
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
    this.currentUserSubject = new BehaviorSubject<User | null>(storedUser);
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(email: string, password: string): Observable<User> {
    // Simulate API call delay
    return of(null).pipe(
      delay(500),
      map(() => {
        const users: User[] = this.storageService.get('users') || [];
        const user = users.find((u) => u.email === email && u.password === password);

        if (!user) {
          throw new Error('Invalid email or password');
        }

        if (!user.isActive) {
          throw new Error('Account is inactive. Please contact administrator.');
        }

        // Store current user
        this.storageService.set('currentUser', user);
        this.currentUserSubject.next(user);

        return user;
      })
    );
  }

  logout(): void {
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
    return this.currentUserValue !== null;
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
    return of(null).pipe(
      delay(500),
      map(() => {
        const users: User[] = this.storageService.get('users') || [];

        // Check if email already exists
        if (users.find((u) => u.email === userData.email)) {
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

        return newUser;
      })
    );
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
