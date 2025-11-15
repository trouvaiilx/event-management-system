// src/app/services/booking.service.ts

import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map, switchMap } from 'rxjs/operators';
import {
  Booking,
  BookingSeat,
  BookingStatus,
  Seat,
  TicketCategory,
  PromotionalCode,
} from '../models/models';
import { StorageService } from './storage.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class BookingService {
  private readonly RESERVATION_TIMEOUT = 10 * 60 * 1000; // 10 minutes

  constructor(
    private storageService: StorageService,
    private notificationService: NotificationService
  ) {
    // Clean up expired reservations periodically
    setInterval(() => this.cleanupExpiredReservations(), 60000); // Every minute
  }

  // UC4: Ticket Booking and Seat Management
  createBooking(bookingData: {
    attendeeId: string;
    eventId: string;
    seats: BookingSeat[];
    promoCode?: string;
  }): Observable<Booking> {
    return of(null).pipe(
      delay(500),
      map(() => {
        // Check seat availability
        const seats: Seat[] = this.storageService.get('seats') || [];
        const requestedSeats = bookingData.seats.map((bs) => bs.seatId);

        for (const seatId of requestedSeats) {
          const seat = seats.find((s) => s.id === seatId);
          if (!seat || !seat.isAvailable || seat.isReserved) {
            throw new Error('One or more selected seats are no longer available');
          }
        }

        // Calculate total amount
        let totalAmount = bookingData.seats.reduce((sum, seat) => sum + seat.price, 0);
        let discountAmount = 0;

        // Apply promotional code if provided
        if (bookingData.promoCode) {
          const promos: PromotionalCode[] = this.storageService.get('promotionalCodes') || [];
          const promo = promos.find(
            (p) =>
              p.code === bookingData.promoCode?.toUpperCase() &&
              p.eventId === bookingData.eventId &&
              p.isActive
          );

          if (promo) {
            if (promo.discountPercentage) {
              discountAmount = (totalAmount * promo.discountPercentage) / 100;
            } else if (promo.discountAmount) {
              discountAmount = promo.discountAmount;
            }

            // Update promo usage count
            this.storageService.updateInCollection('promotionalCodes', promo.id, {
              usageCount: promo.usageCount + 1,
            });
          }
        }

        const finalAmount = totalAmount - discountAmount;

        // Create booking
        const booking: Booking = {
          id: this.generateId('booking'),
          attendeeId: bookingData.attendeeId,
          eventId: bookingData.eventId,
          seats: bookingData.seats,
          totalAmount,
          discountAmount,
          finalAmount,
          promoCode: bookingData.promoCode,
          status: BookingStatus.PENDING,
          createdAt: new Date(),
        };

        // Reserve seats temporarily
        this.reserveSeats(requestedSeats);

        this.storageService.addToCollection('bookings', booking);

        return booking;
      })
    );
  }

  confirmBooking(bookingId: string, qrCode: string): Observable<Booking> {
    return of(null).pipe(
      delay(300),
      map(() => {
        const booking = this.storageService.findInCollection(
          'bookings',
          (b: Booking) => b.id === bookingId
        );

        if (!booking) {
          throw new Error('Booking not found');
        }

        // Update booking status
        const updatedBooking = {
          ...booking,
          status: BookingStatus.CONFIRMED,
          qrCode: qrCode,
        };

        this.storageService.updateInCollection('bookings', bookingId, updatedBooking);

        // Mark seats as booked (unavailable)
        const seatIds = booking.seats.map((s: BookingSeat) => s.seatId);
        this.markSeatsAsBooked(seatIds);

        // Update ticket category available quantity
        this.updateTicketCategoryQuantities(booking.eventId, booking.seats);

        // Send confirmation notification
        this.sendBookingConfirmation(updatedBooking);

        return updatedBooking;
      })
    );
  }

  cancelBooking(bookingId: string): Observable<boolean> {
    return of(null).pipe(
      delay(300),
      map(() => {
        const booking = this.storageService.findInCollection(
          'bookings',
          (b: Booking) => b.id === bookingId
        );

        if (!booking) {
          throw new Error('Booking not found');
        }

        // Check if cancellation is allowed (7 days before event)
        const eventDate = this.getEventDate(booking.eventId);
        const daysUntilEvent = Math.floor(
          (eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        if (daysUntilEvent < 7) {
          throw new Error('Cancellation is not allowed within 7 days of the event');
        }

        // Update booking status
        this.storageService.updateInCollection('bookings', bookingId, {
          status: BookingStatus.CANCELLED,
        });

        // Release seats
        const seatIds = booking.seats.map((s: BookingSeat) => s.seatId);
        this.releaseSeats(seatIds);

        // Update ticket category quantities
        this.restoreTicketCategoryQuantities(booking.eventId, booking.seats);

        // Send cancellation notification
        this.sendCancellationNotification(booking);

        // Notify waitlisted attendees
        this.notifyWaitlist(booking.eventId);

        return true;
      })
    );
  }

  checkInBooking(bookingId: string, qrCode: string): Observable<boolean> {
    return of(null).pipe(
      delay(300),
      map(() => {
        const booking = this.storageService.findInCollection(
          'bookings',
          (b: Booking) => b.id === bookingId
        );

        if (!booking) {
          throw new Error('Booking not found');
        }

        if (booking.qrCode !== qrCode) {
          throw new Error('Invalid QR code');
        }

        if (booking.status !== BookingStatus.CONFIRMED) {
          throw new Error('Booking is not confirmed');
        }

        // Update booking status
        this.storageService.updateInCollection('bookings', bookingId, {
          status: BookingStatus.CHECKED_IN,
          checkedInAt: new Date(),
        });

        return true;
      })
    );
  }

  getBookingById(bookingId: string): Observable<Booking> {
    return of(null).pipe(
      delay(200),
      map(() => {
        return this.storageService.findInCollection('bookings', (b: Booking) => b.id === bookingId);
      })
    );
  }

  getBookingsByAttendee(attendeeId: string): Observable<Booking[]> {
    return of(null).pipe(
      delay(200),
      map(() => {
        return this.storageService.filterCollection(
          'bookings',
          (b: Booking) => b.attendeeId === attendeeId
        );
      })
    );
  }

  getBookingsByEvent(eventId: string): Observable<Booking[]> {
    return of(null).pipe(
      delay(200),
      map(() => {
        return this.storageService.filterCollection(
          'bookings',
          (b: Booking) => b.eventId === eventId
        );
      })
    );
  }

  private reserveSeats(seatIds: string[]): void {
    const seats: Seat[] = this.storageService.get('seats') || [];
    const reservationExpiry = new Date(Date.now() + this.RESERVATION_TIMEOUT);

    seatIds.forEach((seatId) => {
      const seatIndex = seats.findIndex((s) => s.id === seatId);
      if (seatIndex !== -1) {
        seats[seatIndex] = {
          ...seats[seatIndex],
          isReserved: true,
          reservedUntil: reservationExpiry,
        };
      }
    });

    this.storageService.set('seats', seats);
  }

  private markSeatsAsBooked(seatIds: string[]): void {
    const seats: Seat[] = this.storageService.get('seats') || [];

    seatIds.forEach((seatId) => {
      const seatIndex = seats.findIndex((s) => s.id === seatId);
      if (seatIndex !== -1) {
        seats[seatIndex] = {
          ...seats[seatIndex],
          isAvailable: false,
          isReserved: false,
          reservedUntil: undefined,
        };
      }
    });

    this.storageService.set('seats', seats);
  }

  private releaseSeats(seatIds: string[]): void {
    const seats: Seat[] = this.storageService.get('seats') || [];

    seatIds.forEach((seatId) => {
      const seatIndex = seats.findIndex((s) => s.id === seatId);
      if (seatIndex !== -1) {
        seats[seatIndex] = {
          ...seats[seatIndex],
          isAvailable: true,
          isReserved: false,
          reservedUntil: undefined,
        };
      }
    });

    this.storageService.set('seats', seats);
  }

  private cleanupExpiredReservations(): void {
    const seats: Seat[] = this.storageService.get('seats') || [];
    const now = new Date();

    seats.forEach((seat) => {
      if (seat.isReserved && seat.reservedUntil && seat.reservedUntil < now) {
        seat.isReserved = false;
        seat.reservedUntil = undefined;
      }
    });

    this.storageService.set('seats', seats);
  }

  private updateTicketCategoryQuantities(eventId: string, seats: BookingSeat[]): void {
    const categories: TicketCategory[] = this.storageService.get('ticketCategories') || [];

    seats.forEach((seat) => {
      const categoryIndex = categories.findIndex((c) => c.id === seat.ticketCategoryId);
      if (categoryIndex !== -1) {
        categories[categoryIndex].availableQuantity -= 1;
      }
    });

    this.storageService.set('ticketCategories', categories);
  }

  private restoreTicketCategoryQuantities(eventId: string, seats: BookingSeat[]): void {
    const categories: TicketCategory[] = this.storageService.get('ticketCategories') || [];

    seats.forEach((seat) => {
      const categoryIndex = categories.findIndex((c) => c.id === seat.ticketCategoryId);
      if (categoryIndex !== -1) {
        categories[categoryIndex].availableQuantity += 1;
      }
    });

    this.storageService.set('ticketCategories', categories);
  }

  private getEventDate(eventId: string): Date {
    const events = this.storageService.get('events') || [];
    const event = events.find((e: any) => e.id === eventId);
    return event ? new Date(event.date) : new Date();
  }

  private sendBookingConfirmation(booking: Booking): void {
    const message = `
      Your booking has been confirmed!
      
      Booking ID: ${booking.id}
      Number of Tickets: ${booking.seats.length}
      Total Amount: $${booking.finalAmount.toFixed(2)}
      
      Please present your QR code at the event entrance.
      
      Thank you for booking with HELP Events!
    `;

    this.notificationService.sendNotification({
      userId: booking.attendeeId,
      type: 'EMAIL',
      subject: 'Booking Confirmation',
      message: message,
    });
  }

  private sendCancellationNotification(booking: Booking): void {
    const message = `
      Your booking has been cancelled.
      
      Booking ID: ${booking.id}
      Refund Amount: $${booking.finalAmount.toFixed(2)}
      
      Your refund will be processed within 5-7 business days.
      
      Thank you for using HELP Events.
    `;

    this.notificationService.sendNotification({
      userId: booking.attendeeId,
      type: 'EMAIL',
      subject: 'Booking Cancelled',
      message: message,
    });
  }

  private notifyWaitlist(eventId: string): void {
    // This will be handled by waitlist service
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
