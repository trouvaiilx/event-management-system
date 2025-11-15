// src/app/components/attendee/booking-checkout/booking-checkout.component.ts

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BookingService } from '../../../services/booking.service';
import { EventService } from '../../../services/event.service';
import { AuthService } from '../../../services/auth.service';
import { BookingSeat, Event } from '../../../models/models';

@Component({
  selector: 'app-booking-checkout',
  templateUrl: './booking-checkout.component.html',
  styleUrls: ['./booking-checkout.component.scss'],
})
export class BookingCheckoutComponent implements OnInit {
  eventId: string = '';
  event: Event | null = null;
  selectedSeats: BookingSeat[] = [];
  subtotal = 0;
  discount = 0;
  total = 0;

  promoForm: FormGroup;
  applyingPromo = false;
  promoApplied = false;
  appliedPromoCode = '';

  loading = true;
  processing = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private bookingService: BookingService,
    private eventService: EventService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.promoForm = this.formBuilder.group({
      promoCode: ['', Validators.required],
    });

    // Get data from navigation state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state || history.state;

    if (state && state.eventId && state.selectedSeats) {
      this.eventId = state.eventId;
      this.selectedSeats = state.selectedSeats;
      this.subtotal = state.totalPrice || this.calculateSubtotal();
      this.total = this.subtotal;
    } else {
      // No booking data, redirect back
      this.router.navigate(['/attendee/browse-events']);
    }
  }

  ngOnInit(): void {
    if (this.eventId) {
      this.loadEvent();
    }
  }

  loadEvent(): void {
    this.eventService.getEventById(this.eventId).subscribe({
      next: (event) => {
        this.event = event;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading event:', error);
        this.loading = false;
      },
    });
  }

  calculateSubtotal(): number {
    return this.selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  }

  get f() {
    return this.promoForm.controls;
  }

  applyPromoCode(): void {
    if (this.promoForm.invalid) {
      return;
    }

    this.applyingPromo = true;
    const promoCode = this.promoForm.value.promoCode;

    this.eventService.validatePromotionalCode(promoCode, this.eventId).subscribe({
      next: (promo) => {
        if (promo) {
          // Calculate discount
          if (promo.discountPercentage) {
            this.discount = (this.subtotal * promo.discountPercentage) / 100;
          } else if (promo.discountAmount) {
            this.discount = promo.discountAmount;
          }

          this.total = this.subtotal - this.discount;
          this.promoApplied = true;
          this.appliedPromoCode = promo.code;

          this.snackBar.open(
            `Promo code applied! You saved $${this.discount.toFixed(2)}`,
            'Close',
            {
              duration: 3000,
              panelClass: ['success-snackbar'],
            }
          );
        } else {
          this.snackBar.open('Invalid or expired promo code', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar'],
          });
        }
        this.applyingPromo = false;
      },
      error: (error) => {
        this.applyingPromo = false;
        this.snackBar.open('Failed to validate promo code', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  removePromoCode(): void {
    this.discount = 0;
    this.total = this.subtotal;
    this.promoApplied = false;
    this.appliedPromoCode = '';
    this.promoForm.reset();
  }

  confirmBooking(): void {
    const currentUser = this.authService.currentUserValue;

    if (!currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    this.processing = true;

    const bookingData = {
      attendeeId: currentUser.id,
      eventId: this.eventId,
      seats: this.selectedSeats,
      promoCode: this.appliedPromoCode || undefined,
    };

    this.bookingService.createBooking(bookingData).subscribe({
      next: (booking) => {
        this.snackBar.open('Booking created! Proceeding to payment...', 'Close', {
          duration: 2000,
          panelClass: ['success-snackbar'],
        });

        // Navigate to payment
        setTimeout(() => {
          this.router.navigate(['/attendee/payment', booking.id]);
        }, 1000);
      },
      error: (error) => {
        this.processing = false;
        this.snackBar.open(error.message || 'Failed to create booking', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  editSeats(): void {
    this.router.navigate(['/attendee/event', this.eventId, 'seats']);
  }

  cancel(): void {
    this.router.navigate(['/attendee/browse-events']);
  }

  formatSeatLocation(seat: BookingSeat): string {
    return `${seat.section} - Row ${seat.row}, Seat ${seat.number}`;
  }

  formatTicketType(type: string): string {
    return type.replace(/_/g, ' ');
  }
}
