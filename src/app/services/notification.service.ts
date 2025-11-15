// src/app/services/notification.service.ts

import { Injectable } from '@angular/core';
import { Observable, of, Subject } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Notification } from '../models/models';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notificationSubject = new Subject<Notification>();
  public notification$ = this.notificationSubject.asObservable();

  constructor(private storageService: StorageService) {}

  sendNotification(notificationData: {
    userId: string;
    type: 'EMAIL' | 'SMS' | 'IN_APP';
    subject: string;
    message: string;
  }): Observable<Notification> {
    return of(null).pipe(
      delay(100),
      map(() => {
        const notification: Notification = {
          id: this.generateId('notif'),
          userId: notificationData.userId,
          type: notificationData.type,
          subject: notificationData.subject,
          message: notificationData.message,
          sentAt: new Date(),
          isRead: false,
        };

        this.storageService.addToCollection('notifications', notification);

        // Emit notification for real-time updates
        this.notificationSubject.next(notification);

        // Mock email sending
        this.mockEmailSend(notification);

        return notification;
      })
    );
  }

  getNotificationsByUser(userId: string): Observable<Notification[]> {
    return of(null).pipe(
      delay(200),
      map(() => {
        return this.storageService
          .filterCollection('notifications', (n: Notification) => n.userId === userId)
          .sort((a: Notification, b: Notification) => b.sentAt.getTime() - a.sentAt.getTime());
      })
    );
  }

  getUnreadNotifications(userId: string): Observable<Notification[]> {
    return of(null).pipe(
      delay(200),
      map(() => {
        return this.storageService.filterCollection(
          'notifications',
          (n: Notification) => n.userId === userId && !n.isRead
        );
      })
    );
  }

  markAsRead(notificationId: string): Observable<boolean> {
    return of(null).pipe(
      delay(100),
      map(() => {
        this.storageService.updateInCollection('notifications', notificationId, {
          isRead: true,
        });
        return true;
      })
    );
  }

  markAllAsRead(userId: string): Observable<boolean> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const notifications: Notification[] = this.storageService.get('notifications') || [];
        notifications
          .filter((n) => n.userId === userId && !n.isRead)
          .forEach((n) => {
            this.storageService.updateInCollection('notifications', n.id, {
              isRead: true,
            });
          });
        return true;
      })
    );
  }

  deleteNotification(notificationId: string): Observable<boolean> {
    return of(null).pipe(
      delay(100),
      map(() => {
        this.storageService.removeFromCollection('notifications', notificationId);
        return true;
      })
    );
  }

  private mockEmailSend(notification: Notification): void {
    // Simulate email sending in console
    console.log('=== MOCK EMAIL SENT ===');
    console.log('To:', notification.userId);
    console.log('Subject:', notification.subject);
    console.log('Message:', notification.message);
    console.log('Sent At:', notification.sentAt);
    console.log('======================');
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
