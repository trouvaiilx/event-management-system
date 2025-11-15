// src/app/components/attendee/booking-details/booking-details.component.ts

import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BookingService } from '../../../services/booking.service';
import { EventService } from '../../../services/event.service';
import { PdfService } from '../../../services/pdf.service';
import { Booking, Event } from '../../../models/models';

import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-booking-details',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSnackBarModule,
    MatDialogModule,
    QRCodeComponent,
  ],
  templateUrl: './booking-details.component.html',
  styleUrls: ['./booking-details.component.scss'],
})
export class BookingDetailsComponent implements OnInit {
  @ViewChild('qrCodeElement', { static: false }) qrCodeElement!: ElementRef;

  bookingId: string = '';
  booking: Booking | null = null;
  event: Event | null = null;
  loading = true;
  cancelling = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private bookingService: BookingService,
    private eventService: EventService,
    private pdfService: PdfService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.bookingId = this.route.snapshot.paramMap.get('id') || '';
    this.loadBookingDetails();
  }

  loadBookingDetails(): void {
    this.loading = true;

    this.bookingService.getBookingById(this.bookingId).subscribe({
      next: (booking) => {
        if (!booking) {
          this.snackBar.open('Booking not found', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar'],
          });
          this.router.navigate(['/attendee/my-bookings']);
          return;
        }

        this.booking = booking;
        this.loadEvent();
      },
      error: (error) => {
        console.error('Error loading booking:', error);
        this.loading = false;
        this.router.navigate(['/attendee/my-bookings']);
      },
    });
  }

  loadEvent(): void {
    if (!this.booking) return;

    this.eventService.getEventById(this.booking.eventId).subscribe({
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

  getStatusColor(): string {
    if (!this.booking) return '';

    switch (this.booking.status) {
      case 'CONFIRMED':
        return 'primary';
      case 'CHECKED_IN':
        return 'accent';
      case 'CANCELLED':
        return 'warn';
      default:
        return '';
    }
  }

  canCancelBooking(): boolean {
    if (!this.booking || !this.event) return false;

    if (this.booking.status !== 'CONFIRMED') return false;

    // Check if at least 7 days before event
    const eventDate = new Date(this.event.date);
    const today = new Date();
    const daysUntilEvent = Math.floor(
      (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysUntilEvent >= 7;
  }

  cancelBooking(): void {
    if (!this.booking) return;

    const confirmCancel = confirm(
      'Are you sure you want to cancel this booking? A full refund will be processed within 5-7 business days.'
    );

    if (!confirmCancel) return;

    this.cancelling = true;

    this.bookingService.cancelBooking(this.booking.id).subscribe({
      next: () => {
        this.snackBar.open('Booking cancelled successfully. Refund will be processed.', 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar'],
        });
        this.loadBookingDetails();
        this.cancelling = false;
      },
      error: (error) => {
        this.cancelling = false;
        this.snackBar.open(error.message || 'Failed to cancel booking', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  downloadTicket(): void {
    if (!this.booking || !this.event) return;

    // Get QR code as data URL
    const qrCodeCanvas = this.qrCodeElement?.nativeElement?.querySelector('canvas');
    const qrCodeDataUrl = qrCodeCanvas ? qrCodeCanvas.toDataURL('image/png') : '';

    this.pdfService.generateTicket(this.booking, this.event.name, this.event.date, qrCodeDataUrl);

    this.snackBar.open('Ticket downloaded successfully!', 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar'],
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  formatSeatLocation(seat: any): string {
    return `${seat.section} - Row ${seat.row}, Seat ${seat.number}`;
  }

  formatTicketType(type: string): string {
    return type.replace(/_/g, ' ');
  }

  goBack(): void {
    this.router.navigate(['/attendee/my-bookings']);
  }
}
