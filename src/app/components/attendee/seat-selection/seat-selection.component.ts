// src/app/components/attendee/seat-selection/seat-selection.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EventService } from '../../../services/event.service';
import { AuthService } from '../../../services/auth.service';
import { Seat, TicketCategory, Event, BookingSeat } from '../../../models/models';
import { interval, Subscription } from 'rxjs';

import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-seat-selection',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatTableModule,
    MatSnackBarModule,
  ],
  templateUrl: './seat-selection.component.html',
  styleUrls: ['./seat-selection.component.scss'],
})
export class SeatSelectionComponent implements OnInit, OnDestroy {
  eventId: string = '';
  event: Event | null = null;
  seats: Seat[] = [];
  ticketCategories: TicketCategory[] = [];
  selectedSeats: Seat[] = [];
  loading = true;

  seatSections = ['FRONT', 'MIDDLE', 'BACK'];

  // Reservation timer (10 minutes)
  reservationTimeLeft = 600; // seconds
  timerSubscription?: Subscription;
  showTimer = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('id') || '';
    this.loadEventAndSeats();
  }

  ngOnDestroy(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  loadEventAndSeats(): void {
    this.loading = true;

    this.eventService.getEventById(this.eventId).subscribe({
      next: (event) => {
        this.event = event;
      },
      error: (error) => {
        console.error('Error loading event:', error);
        this.snackBar.open('Failed to load event', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
      },
    });

    this.eventService.getSeatsByEvent(this.eventId).subscribe({
      next: (seats) => {
        this.seats = seats;
      },
      error: (error) => console.error('Error loading seats:', error),
    });

    this.eventService.getTicketCategoriesByEvent(this.eventId).subscribe({
      next: (categories) => {
        this.ticketCategories = categories;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading ticket categories:', error);
        this.loading = false;
      },
    });
  }

  getSeatsBySection(section: string): Seat[] {
    return this.seats.filter((s) => s.section === section);
  }

  isSeatSelected(seat: Seat): boolean {
    return this.selectedSeats.some((s) => s.id === seat.id);
  }

  toggleSeat(seat: Seat): void {
    if (!seat.isAvailable || seat.isReserved) {
      this.snackBar.open('This seat is not available', 'Close', {
        duration: 2000,
      });
      return;
    }

    const index = this.selectedSeats.findIndex((s) => s.id === seat.id);

    if (index > -1) {
      // Deselect seat
      this.selectedSeats.splice(index, 1);
      if (this.selectedSeats.length === 0) {
        this.stopTimer();
      }
    } else {
      // Select seat
      const category = this.ticketCategories.find((tc) => tc.id === seat.ticketCategoryId);

      if (category && category.maxPerBooking) {
        const sameCategoryCount = this.selectedSeats.filter(
          (s) => s.ticketCategoryId === seat.ticketCategoryId
        ).length;

        if (sameCategoryCount >= category.maxPerBooking) {
          this.snackBar.open(
            `Maximum ${category.maxPerBooking} tickets per booking for this category`,
            'Close',
            { duration: 3000 }
          );
          return;
        }
      }

      this.selectedSeats.push(seat);

      // Start timer on first selection
      if (this.selectedSeats.length === 1) {
        this.startTimer();
      }
    }
  }

  getSeatClass(seat: Seat): string {
    if (!seat.isAvailable) return 'occupied';
    if (seat.isReserved) return 'reserved';
    if (this.isSeatSelected(seat)) return 'selected';
    return 'available';
  }

  getSeatPrice(seat: Seat): number {
    const category = this.ticketCategories.find((tc) => tc.id === seat.ticketCategoryId);
    return category?.price || 0;
  }

  getSeatTypeName(seat: Seat): string {
    const category = this.ticketCategories.find((tc) => tc.id === seat.ticketCategoryId);
    return category?.type.replace(/_/g, ' ') || '';
  }

  getTotalPrice(): number {
    return this.selectedSeats.reduce((sum, seat) => sum + this.getSeatPrice(seat), 0);
  }

  getSelectedSeatsDetails(): BookingSeat[] {
    return this.selectedSeats.map((seat) => ({
      seatId: seat.id,
      ticketCategoryId: seat.ticketCategoryId,
      ticketType: this.ticketCategories.find((tc) => tc.id === seat.ticketCategoryId)?.type!,
      section: seat.section,
      row: seat.row,
      number: seat.number,
      price: this.getSeatPrice(seat),
    }));
  }

  startTimer(): void {
    this.showTimer = true;
    this.reservationTimeLeft = 600;

    this.timerSubscription = interval(1000).subscribe(() => {
      this.reservationTimeLeft--;

      if (this.reservationTimeLeft <= 0) {
        this.onTimerExpired();
      }
    });
  }

  stopTimer(): void {
    this.showTimer = false;
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  onTimerExpired(): void {
    this.stopTimer();
    this.selectedSeats = [];
    this.snackBar.open('Reservation time expired. Please select seats again.', 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }

  getTimerDisplay(): string {
    const minutes = Math.floor(this.reservationTimeLeft / 60);
    const seconds = this.reservationTimeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  isTimerLow(): boolean {
    return this.reservationTimeLeft <= 120; // 2 minutes
  }

  proceedToCheckout(): void {
    if (this.selectedSeats.length === 0) {
      this.snackBar.open('Please select at least one seat', 'Close', {
        duration: 3000,
      });
      return;
    }

    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/attendee/event/${this.eventId}/seats` },
      });
      return;
    }

    // Navigate to checkout with selected seats data
    this.router.navigate(['/attendee/checkout'], {
      state: {
        eventId: this.eventId,
        selectedSeats: this.getSelectedSeatsDetails(),
        totalPrice: this.getTotalPrice(),
      },
    });
  }

  clearSelection(): void {
    this.selectedSeats = [];
    this.stopTimer();
  }

  goBack(): void {
    this.router.navigate(['/attendee/event', this.eventId]);
  }

  getRowsInSection(section: string): string[] {
    const sectionSeats = this.getSeatsBySection(section);
    const rows = [...new Set(sectionSeats.map((s) => s.row))];
    return rows.sort();
  }

  getSeatsInRow(section: string, row: string): Seat[] {
    return this.seats
      .filter((s) => s.section === section && s.row === row)
      .sort((a, b) => a.number - b.number);
  }

  getSeatTooltip(seat: Seat): string {
    if (!seat.isAvailable) {
      return 'Occupied';
    }
    if (seat.isReserved) {
      return 'Reserved by another user';
    }
    const price = this.getSeatPrice(seat);
    const type = this.getSeatTypeName(seat);
    return `${type} - ${price.toFixed(2)}`;
  }
}
