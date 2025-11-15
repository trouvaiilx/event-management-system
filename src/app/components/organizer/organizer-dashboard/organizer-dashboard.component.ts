// src/app/components/organizer/organizer-dashboard/organizer-dashboard.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { EventService } from '../../../services/event.service';
import { BookingService } from '../../../services/booking.service';
import { User, Event, Booking, EventStatus } from '../../../models/models';

import { NavbarComponent } from '../../shared/navbar/navbar.component';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-organizer-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatTableModule,
  ],
  templateUrl: './organizer-dashboard.component.html',
  styleUrls: ['./organizer-dashboard.component.scss'],
})
export class OrganizerDashboardComponent implements OnInit {
  currentUser: User | null = null;
  loading = true;

  // Statistics
  totalEvents = 0;
  upcomingEvents = 0;
  totalTicketsSold = 0;
  totalRevenue = 0;

  // Charts data
  recentEvents: Event[] = [];
  recentBookings: Booking[] = [];

  // Event status counts
  draftEvents = 0;
  publishedEvents = 0;
  completedEvents = 0;

  constructor(
    private authService: AuthService,
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

    if (!this.currentUser) return;

    // Load organizer's events
    this.eventService.getEventsByOrganizer(this.currentUser.id).subscribe({
      next: (events) => {
        this.totalEvents = events.length;
        this.upcomingEvents = events.filter(
          (e) => e.date >= new Date() && e.status === EventStatus.PUBLISHED
        ).length;

        // Count by status
        this.draftEvents = events.filter((e) => e.status === EventStatus.DRAFT).length;
        this.publishedEvents = events.filter((e) => e.status === EventStatus.PUBLISHED).length;
        this.completedEvents = events.filter((e) => e.status === EventStatus.COMPLETED).length;

        // Get recent events
        this.recentEvents = events
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, 5);

        // Load bookings for all events
        this.loadBookingsData(events);
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.loading = false;
      },
    });
  }

  loadBookingsData(events: Event[]): void {
    let allBookings: Booking[] = [];
    let loadedCount = 0;

    if (events.length === 0) {
      this.loading = false;
      return;
    }

    events.forEach((event) => {
      this.bookingService.getBookingsByEvent(event.id).subscribe({
        next: (bookings) => {
          allBookings = [...allBookings, ...bookings];
          loadedCount++;

          if (loadedCount === events.length) {
            this.processBookingsData(allBookings);
          }
        },
        error: (error) => {
          console.error('Error loading bookings:', error);
          loadedCount++;
          if (loadedCount === events.length) {
            this.processBookingsData(allBookings);
          }
        },
      });
    });
  }

  processBookingsData(bookings: Booking[]): void {
    const confirmedBookings = bookings.filter((b) => b.status === 'CONFIRMED');

    this.totalTicketsSold = confirmedBookings.reduce((sum, b) => sum + b.seats.length, 0);
    this.totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.finalAmount, 0);

    this.recentBookings = bookings
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);

    this.loading = false;
  }

  navigateToCreateEvent(): void {
    this.router.navigate(['/organizer/create-event']);
  }

  navigateToManageEvents(): void {
    this.router.navigate(['/organizer/manage-events']);
  }

  navigateToEvent(eventId: string): void {
    this.router.navigate(['/organizer/event', eventId]);
  }

  getEventStatusColor(status: EventStatus): string {
    switch (status) {
      case EventStatus.DRAFT:
        return 'accent';
      case EventStatus.PUBLISHED:
        return 'primary';
      case EventStatus.ONGOING:
        return 'warn';
      case EventStatus.COMPLETED:
        return '';
      case EventStatus.CANCELLED:
        return 'warn';
      default:
        return '';
    }
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
