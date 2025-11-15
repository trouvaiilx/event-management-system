// src/app/components/attendee/payment/payment.component.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PaymentService } from '../../../services/payment.service';
import { BookingService } from '../../../services/booking.service';
import { QrCodeService } from '../../../services/qr-code.service';
import { Booking, PaymentMethod } from '../../../models/models';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
})
export class PaymentComponent implements OnInit {
  bookingId: string = '';
  booking: Booking | null = null;
  paymentForm: FormGroup;
  processing = false;
  loading = true;

  paymentMethods = [
    { value: PaymentMethod.CREDIT_CARD, label: 'Credit Card', icon: 'credit_card' },
    { value: PaymentMethod.DEBIT_CARD, label: 'Debit Card', icon: 'credit_card' },
    { value: PaymentMethod.E_WALLET, label: 'E-Wallet', icon: 'account_balance_wallet' },
    { value: PaymentMethod.BANK_TRANSFER, label: 'Bank Transfer', icon: 'account_balance' },
  ];

  showTestCards = false;
  testCards: any[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService,
    private bookingService: BookingService,
    private qrCodeService: QrCodeService,
    private snackBar: MatSnackBar
  ) {
    this.paymentForm = this.formBuilder.group({
      paymentMethod: [PaymentMethod.CREDIT_CARD, Validators.required],
      cardNumber: ['', [Validators.required, Validators.pattern(/^\d{16}$/)]],
      cardHolder: ['', Validators.required],
      expiryDate: ['', [Validators.required, Validators.pattern(/^\d{2}\/\d{2}$/)]],
      cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
    });

    // Load test cards
    const mockCards = this.paymentService.getMockCardDetails();
    this.testCards = mockCards.testCards;
  }

  ngOnInit(): void {
    this.bookingId = this.route.snapshot.paramMap.get('bookingId') || '';
    this.loadBooking();
  }

  loadBooking(): void {
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

        if (booking.status !== 'PENDING') {
          this.snackBar.open('This booking has already been processed', 'Close', {
            duration: 3000,
          });
          this.router.navigate(['/attendee/booking', booking.id]);
          return;
        }

        this.booking = booking;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading booking:', error);
        this.loading = false;
        this.router.navigate(['/attendee/my-bookings']);
      },
    });
  }

  get f() {
    return this.paymentForm.controls;
  }

  onPaymentMethodChange(): void {
    const method = this.paymentForm.value.paymentMethod;

    if (method === PaymentMethod.CREDIT_CARD || method === PaymentMethod.DEBIT_CARD) {
      // Enable card fields
      this.f['cardNumber'].enable();
      this.f['cardHolder'].enable();
      this.f['expiryDate'].enable();
      this.f['cvv'].enable();
    } else {
      // Disable card fields for other methods
      this.f['cardNumber'].disable();
      this.f['cardHolder'].disable();
      this.f['expiryDate'].disable();
      this.f['cvv'].disable();
    }
  }

  useTestCard(card: any): void {
    this.paymentForm.patchValue({
      cardNumber: card.number.replace(/\s/g, ''),
      expiryDate: card.expiry,
      cvv: card.cvv,
      cardHolder: 'Test User',
    });
  }

  formatCardNumber(): void {
    let value = this.f['cardNumber'].value?.replace(/\s/g, '') || '';
    if (value.length > 16) {
      value = value.substring(0, 16);
    }
    this.f['cardNumber'].setValue(value);
  }

  formatExpiryDate(): void {
    let value = this.f['expiryDate'].value?.replace(/\D/g, '') || '';
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    this.f['expiryDate'].setValue(value);
  }

  processPayment(): void {
    if (this.paymentForm.invalid) {
      Object.keys(this.paymentForm.controls).forEach((key) => {
        this.paymentForm.get(key)?.markAsTouched();
      });
      return;
    }

    if (!this.booking) return;

    this.processing = true;

    const paymentData = {
      bookingId: this.booking.id,
      amount: this.booking.finalAmount,
      method: this.paymentForm.value.paymentMethod,
      cardNumber: this.paymentForm.value.cardNumber,
      cardExpiry: this.paymentForm.value.expiryDate,
      cardCVV: this.paymentForm.value.cvv,
    };

    this.paymentService.processPayment(paymentData).subscribe({
      next: (payment) => {
        // Payment successful, generate QR code
        this.qrCodeService
          .generateQRCode(this.booking!.id, this.booking!.attendeeId, this.booking!.eventId)
          .subscribe({
            next: (qrCode) => {
              // Confirm booking with QR code
              this.bookingService.confirmBooking(this.booking!.id, qrCode).subscribe({
                next: () => {
                  this.snackBar.open('Payment successful!', 'Close', {
                    duration: 3000,
                    panelClass: ['success-snackbar'],
                  });

                  // Navigate to booking details
                  setTimeout(() => {
                    this.router.navigate(['/attendee/booking', this.booking!.id]);
                  }, 1500);
                },
                error: (error) => {
                  console.error('Error confirming booking:', error);
                  this.processing = false;
                },
              });
            },
            error: (error) => {
              console.error('Error generating QR code:', error);
              this.processing = false;
            },
          });
      },
      error: (error) => {
        this.processing = false;
        this.snackBar.open(error.message || 'Payment failed. Please try again.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/attendee/my-bookings']);
  }
}
