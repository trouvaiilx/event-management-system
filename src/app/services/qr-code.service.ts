// src/app/services/qr-code.service.ts

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class QrCodeService {
  constructor() {}

  generateQRCode(bookingId: string, attendeeId: string, eventId: string): Observable<string> {
    return of(null).pipe(
      delay(200),
      map(() => {
        // Generate a unique QR code string
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        const qrData = `${bookingId}-${attendeeId}-${eventId}-${timestamp}-${random}`;

        // In production, this would be encoded as actual QR code data
        // For mock purposes, we return the string that will be converted to QR by the component
        return qrData;
      })
    );
  }

  validateQRCode(qrCode: string, bookingId: string): Observable<boolean> {
    return of(null).pipe(
      delay(300),
      map(() => {
        // Extract booking ID from QR code
        const parts = qrCode.split('-');
        const extractedBookingId = parts[0];

        return extractedBookingId === bookingId;
      })
    );
  }

  decodeQRCode(qrCode: string): Observable<{
    bookingId: string;
    attendeeId: string;
    eventId: string;
    timestamp: number;
  }> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const parts = qrCode.split('-');

        return {
          bookingId: parts[0],
          attendeeId: parts[1],
          eventId: parts[2],
          timestamp: parseInt(parts[3]),
        };
      })
    );
  }
}
