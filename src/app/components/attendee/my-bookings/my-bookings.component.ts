// src/app/components/attendee/my-bookings/my-bookings.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BookingService } from '../../../services/booking.service';
import { EventService } from '../../../services/event.service';
import { AuthService } from '../../../services/auth.service';
import { Booking, Event } from '../../../models/models';

import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent,
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
  ],
  templateUrl: './my-bookings.component.html',
  styleUrls: ['./my-bookings.component.scss'],
})
export class MyBookingsComponent implements OnInit {
  bookings: Booking[] = [];
  events: Map<string, Event> = new Map();
  loading = true;

  constructor(
    private bookingService: BookingService,
    private eventService: EventService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return;

    this.bookingService.getBookingsByAttendee(currentUser.id).subscribe({
      next: (bookings) => {
        this.bookings = bookings.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        this.loadEvents();
      },
      error: (error) => {
        console.error('Error loading bookings:', error);
        this.loading = false;
      },
    });
  }

  loadEvents(): void {
    const eventIds = [...new Set(this.bookings.map((b) => b.eventId))];

    if (eventIds.length === 0) {
      this.loading = false;
      return;
    }

    let loadedCount = 0;
    eventIds.forEach((eventId) => {
      this.eventService.getEventById(eventId).subscribe({
        next: (event) => {
          this.events.set(eventId, event);
          loadedCount++;
          if (loadedCount === eventIds.length) {
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('Error loading event:', error);
          loadedCount++;
          if (loadedCount === eventIds.length) {
            this.loading = false;
          }
        },
      });
    });
  }

  viewBooking(bookingId: string): void {
    this.router.navigate(['/attendee/booking', bookingId]);
  }

  getEvent(eventId: string): Event | undefined {
    return this.events.get(eventId);
  }
}
