// src/app/services/user.service.ts

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { User, UserRole } from '../models/models';
import { StorageService } from './storage.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(
    private storageService: StorageService,
    private notificationService: NotificationService
  ) {}

  // UC1: Register Event Organiser
  registerEventOrganizer(userData: {
    fullName: string;
    email: string;
    phoneNumber: string;
    organizationName?: string;
  }): Observable<User> {
    return of(null).pipe(
      delay(500),
      map(() => {
        const users: User[] = this.storageService.get('users') || [];

        // Check if email already exists
        if (users.find((u) => u.email === userData.email)) {
          throw new Error('Email already registered by another user');
        }

        // Generate default password
        const defaultPassword = this.generateDefaultPassword();

        const newUser: User = {
          id: this.generateId('org'),
          email: userData.email,
          password: defaultPassword,
          role: UserRole.EVENT_ORGANIZER,
          fullName: userData.fullName,
          phoneNumber: userData.phoneNumber,
          organizationName: userData.organizationName,
          createdAt: new Date(),
          mustChangePassword: true,
          isActive: true,
        };

        this.storageService.addToCollection('users', newUser);

        // Send welcome email notification
        this.sendWelcomeEmail(newUser, defaultPassword);

        return newUser;
      })
    );
  }

  getAllEventOrganizers(): Observable<User[]> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const users: User[] = this.storageService.get('users') || [];
        return users.filter((u) => u.role === UserRole.EVENT_ORGANIZER);
      })
    );
  }

  getUserById(userId: string): Observable<User | undefined> {
    return of(null).pipe(
      delay(200),
      map(() => {
        return this.storageService.findInCollection('users', (u: User) => u.id === userId);
      })
    );
  }

  updateUser(userId: string, updates: Partial<User>): Observable<User> {
    return of(null).pipe(
      delay(300),
      map(() => {
        this.storageService.updateInCollection('users', userId, updates);
        return this.storageService.findInCollection('users', (u: User) => u.id === userId);
      })
    );
  }

  deactivateUser(userId: string): Observable<boolean> {
    return this.updateUser(userId, { isActive: false }).pipe(map(() => true));
  }

  activateUser(userId: string): Observable<boolean> {
    return this.updateUser(userId, { isActive: true }).pipe(map(() => true));
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDefaultPassword(): string {
    // Generate a random password: Format: Event@XXXX
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `Event@${randomNum}`;
  }

  private sendWelcomeEmail(user: User, password: string): void {
    const message = `
      Welcome to HELP Events Management System!
      
      Your account has been created successfully.
      
      Username: ${user.email}
      Default Password: ${password}
      
      Please log in and change your password immediately for security purposes.
      
      Login URL: https://helpevents.com/login
      
      If you have any questions, please contact the administrator.
      
      Best regards,
      HELP Events Team
    `;

    this.notificationService.sendNotification({
      userId: user.id,
      type: 'EMAIL',
      subject: 'Welcome to HELP Events - Account Created',
      message: message,
    });
  }
}
