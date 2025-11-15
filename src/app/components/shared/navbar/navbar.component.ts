// src/app/components/shared/navbar/navbar.component.ts

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { User, Notification } from '../../../models/models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  currentUser: User | null = null;
  unreadNotifications: Notification[] = [];
  unreadCount = 0;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
      if (user) {
        this.loadNotifications();
      }
    });

    // Subscribe to real-time notifications
    this.notificationService.notification$.subscribe((notification) => {
      if (notification && notification.userId === this.currentUser?.id) {
        this.loadNotifications();
      }
    });
  }

  loadNotifications(): void {
    if (!this.currentUser) return;

    this.notificationService.getUnreadNotifications(this.currentUser.id).subscribe({
      next: (notifications) => {
        this.unreadNotifications = notifications;
        this.unreadCount = notifications.length;
      },
      error: (error) => console.error('Error loading notifications:', error),
    });
  }

  navigateToDashboard(): void {
    if (!this.currentUser) return;

    switch (this.currentUser.role) {
      case 'ADMIN':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'EVENT_ORGANIZER':
        this.router.navigate(['/organizer/dashboard']);
        break;
      case 'ATTENDEE':
        this.router.navigate(['/attendee/dashboard']);
        break;
    }
  }

  navigateToProfile(): void {
    // Navigate to profile/settings page (to be implemented)
    this.router.navigate(['/change-password']);
  }

  markNotificationAsRead(notification: Notification): void {
    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        this.loadNotifications();
      },
    });
  }

  markAllAsRead(): void {
    if (!this.currentUser) return;

    this.notificationService.markAllAsRead(this.currentUser.id).subscribe({
      next: () => {
        this.loadNotifications();
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getUserRole(): string {
    if (!this.currentUser) return '';

    switch (this.currentUser.role) {
      case 'ADMIN':
        return 'Administrator';
      case 'EVENT_ORGANIZER':
        return 'Event Organizer';
      case 'ATTENDEE':
        return 'Attendee';
      default:
        return '';
    }
  }

  getNavigationLinks(): { label: string; route: string; icon: string }[] {
    if (!this.currentUser) return [];

    switch (this.currentUser.role) {
      case 'ADMIN':
        return [
          { label: 'Dashboard', route: '/admin/dashboard', icon: 'dashboard' },
          { label: 'Register Organizer', route: '/admin/register-organizer', icon: 'person_add' },
          {
            label: 'Manage Organizers',
            route: '/admin/manage-organizers',
            icon: 'manage_accounts',
          },
          { label: 'Reports', route: '/admin/reports', icon: 'assessment' },
        ];
      case 'EVENT_ORGANIZER':
        return [
          { label: 'Dashboard', route: '/organizer/dashboard', icon: 'dashboard' },
          { label: 'Create Event', route: '/organizer/create-event', icon: 'add_circle' },
          { label: 'My Events', route: '/organizer/manage-events', icon: 'event' },
        ];
      case 'ATTENDEE':
        return [
          { label: 'Dashboard', route: '/attendee/dashboard', icon: 'dashboard' },
          { label: 'Browse Events', route: '/attendee/browse-events', icon: 'explore' },
          { label: 'My Bookings', route: '/attendee/my-bookings', icon: 'confirmation_number' },
          { label: 'Waitlist', route: '/attendee/waitlist', icon: 'schedule' },
        ];
      default:
        return [];
    }
  }
}
