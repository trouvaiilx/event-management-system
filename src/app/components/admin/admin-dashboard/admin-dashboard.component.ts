// src/app/components/admin/admin-dashboard/admin-dashboard.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { EventService } from '../../../services/event.service';
import { BookingService } from '../../../services/booking.service';
import { User, Event, Booking } from '../../../models/models';

import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTableModule,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit {
  currentUser: User | null = null;
  loading = true;

  // Statistics
  totalOrganizers = 0;
  totalEvents = 0;
  totalBookings = 0;
  totalRevenue = 0;

  // Recent data
  recentOrganizers: User[] = [];
  recentEvents: Event[] = [];

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private eventService: EventService,
    private bookingService: BookingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;

    // Load organizers
    this.userService.getAllEventOrganizers().subscribe({
      next: (organizers) => {
        this.totalOrganizers = organizers.length;
        this.recentOrganizers = organizers.slice(0, 5);
      },
      error: (error) => console.error('Error loading organizers:', error),
    });

    // Load events
    this.eventService.getAllEvents().subscribe({
      next: (events) => {
        this.totalEvents = events.length;
        this.recentEvents = events
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 5);
      },
      error: (error) => console.error('Error loading events:', error),
    });

    // Load bookings and calculate revenue
    this.bookingService.getBookingsByEvent('').subscribe({
      next: (bookings: Booking[]) => {
        this.totalBookings = bookings.filter((b) => b.status === 'CONFIRMED').length;
        this.totalRevenue = bookings
          .filter((b) => b.status === 'CONFIRMED')
          .reduce((sum, b) => sum + b.finalAmount, 0);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading bookings:', error);
        this.loading = false;
      },
    });
  }

  navigateToRegisterOrganizer(): void {
    this.router.navigate(['/admin/register-organizer']);
  }

  navigateToManageOrganizers(): void {
    this.router.navigate(['/admin/manage-organizers']);
  }

  navigateToReports(): void {
    this.router.navigate(['/admin/reports']);
  }

  getOrganizerName(organizerId: string): string {
    const organizer = this.recentOrganizers.find((o) => o.id === organizerId);
    return organizer ? organizer.fullName : 'Unknown';
  }
}
