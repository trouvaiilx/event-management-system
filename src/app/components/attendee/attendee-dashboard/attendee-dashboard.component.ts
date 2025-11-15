// src/app/components/attendee/attendee-dashboard/attendee-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { EventService } from '../../../services/event.service';
import { BookingService } from '../../../services/booking.service';
import { User, Event, Booking } from '../../../models/models';

import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-attendee-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatChipsModule,
  ],
  templateUrl: './attendee-dashboard.component.html',
  styleUrls: ['./attendee-dashboard.component.scss'],
})
export class AttendeeDashboardComponent implements OnInit {
  currentUser: User | null = null;
  upcomingEvents: Event[] = [];
  recentBookings: Booking[] = [];
  loading = true;

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
    this.eventService.getPublishedEvents().subscribe({
      next: (events) => {
        this.upcomingEvents = events
          .filter((e) => e.date >= new Date())
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .slice(0, 6);
      },
      error: (error) => console.error('Error loading events:', error),
    });

    if (this.currentUser) {
      this.bookingService.getBookingsByAttendee(this.currentUser.id).subscribe({
        next: (bookings) => {
          this.recentBookings = bookings
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 5);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading bookings:', error);
          this.loading = false;
        },
      });
    }
  }

  navigateToBrowseEvents(): void {
    this.router.navigate(['/attendee/browse-events']);
  }

  navigateToMyBookings(): void {
    this.router.navigate(['/attendee/my-bookings']);
  }

  viewEvent(eventId: string): void {
    this.router.navigate(['/attendee/event', eventId]);
  }

  viewBooking(bookingId: string): void {
    this.router.navigate(['/attendee/booking', bookingId]);
  }
}
