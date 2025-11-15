// src/app/services/payment.service.ts

import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Payment, PaymentStatus, PaymentMethod } from '../models/models';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  constructor(private storageService: StorageService) {}

  // UC5: Payment Processing (Mock Gateway)
  processPayment(paymentData: {
    bookingId: string;
    amount: number;
    method: PaymentMethod;
    cardNumber?: string;
    cardExpiry?: string;
    cardCVV?: string;
    walletId?: string;
  }): Observable<Payment> {
    return of(null).pipe(
      delay(2000), // Simulate payment processing delay
      map(() => {
        // Mock payment validation
        if (
          paymentData.method === PaymentMethod.CREDIT_CARD ||
          paymentData.method === PaymentMethod.DEBIT_CARD
        ) {
          this.validateCardPayment(
            paymentData.cardNumber!,
            paymentData.cardExpiry!,
            paymentData.cardCVV!
          );
        }

        // Simulate random payment success/failure (95% success rate)
        const isSuccess = Math.random() > 0.05;

        if (!isSuccess) {
          throw new Error('Payment processing failed. Please try again.');
        }

        const payment: Payment = {
          id: this.generateId('payment'),
          bookingId: paymentData.bookingId,
          amount: paymentData.amount,
          method: paymentData.method,
          status: PaymentStatus.COMPLETED,
          transactionId: this.generateTransactionId(),
          paymentDate: new Date(),
          cardLastFour: paymentData.cardNumber ? paymentData.cardNumber.slice(-4) : undefined,
          createdAt: new Date(),
        };

        this.storageService.addToCollection('payments', payment);

        return payment;
      })
    );
  }

  getPaymentByBooking(bookingId: string): Observable<Payment | undefined> {
    return of(null).pipe(
      delay(200),
      map(() => {
        return this.storageService.findInCollection(
          'payments',
          (p: Payment) => p.bookingId === bookingId
        );
      })
    );
  }

  getAllPayments(): Observable<Payment[]> {
    return of(this.storageService.get('payments') || []).pipe(delay(200));
  }

  refundPayment(paymentId: string): Observable<Payment> {
    return of(null).pipe(
      delay(1500),
      map(() => {
        const payment = this.storageService.findInCollection(
          'payments',
          (p: Payment) => p.id === paymentId
        );

        if (!payment) {
          throw new Error('Payment not found');
        }

        if (payment.status !== PaymentStatus.COMPLETED) {
          throw new Error('Only completed payments can be refunded');
        }

        this.storageService.updateInCollection('payments', paymentId, {
          status: PaymentStatus.REFUNDED,
        });

        const updatedPayment = this.storageService.findInCollection(
          'payments',
          (p: Payment) => p.id === paymentId
        );

        return updatedPayment;
      })
    );
  }

  private validateCardPayment(cardNumber: string, expiry: string, cvv: string): void {
    // Remove spaces from card number
    const cleanCardNumber = cardNumber.replace(/\s/g, '');

    // Basic validation
    if (!/^\d{16}$/.test(cleanCardNumber)) {
      throw new Error('Invalid card number. Must be 16 digits.');
    }

    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      throw new Error('Invalid expiry date. Format should be MM/YY.');
    }

    if (!/^\d{3,4}$/.test(cvv)) {
      throw new Error('Invalid CVV. Must be 3 or 4 digits.');
    }

    // Check expiry date
    const [month, year] = expiry.split('/').map(Number);
    const expiryDate = new Date(2000 + year, month - 1);

    if (expiryDate < new Date()) {
      throw new Error('Card has expired.');
    }

    // Luhn algorithm for card number validation
    if (!this.luhnCheck(cleanCardNumber)) {
      throw new Error('Invalid card number.');
    }
  }

  private luhnCheck(cardNumber: string): boolean {
    let sum = 0;
    let isEven = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  private generateTransactionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `TXN-${timestamp}-${random}`;
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Mock payment gateway methods
  getMockCardDetails(): {
    testCards: {
      number: string;
      expiry: string;
      cvv: string;
      type: string;
    }[];
  } {
    return {
      testCards: [
        {
          number: '4532 1488 0343 6467',
          expiry: '12/25',
          cvv: '123',
          type: 'Visa',
        },
        {
          number: '5425 2334 3010 9903',
          expiry: '11/26',
          cvv: '456',
          type: 'Mastercard',
        },
        {
          number: '3782 822463 10005',
          expiry: '10/27',
          cvv: '7890',
          type: 'American Express',
        },
      ],
    };
  }
}
