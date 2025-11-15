// src/app/services/waitlist.service.ts

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Waitlist, TicketType } from '../models/models';
import { StorageService } from './storage.service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class WaitlistService {
  private readonly MAX_WAITLIST_SIZE = 50;

  constructor(
    private storageService: StorageService,
    private notificationService: NotificationService
  ) {}

  // UC6: Manage Waitlist
  joinWaitlist(waitlistData: {
    eventId: string;
    attendeeId: string;
    email: string;
    phoneNumber: string;
    ticketType: TicketType;
    quantity: number;
  }): Observable<Waitlist> {
    return of(null).pipe(
      delay(300),
      map(() => {
        const waitlists: Waitlist[] = this.storageService.get('waitlists') || [];

        // Check if event waitlist is full
        const eventWaitlist = waitlists.filter(
          (w) => w.eventId === waitlistData.eventId && w.status === 'WAITING'
        );

        if (eventWaitlist.length >= this.MAX_WAITLIST_SIZE) {
          throw new Error('Waitlist capacity has been reached for this event');
        }

        // Check if user already on waitlist
        const existingEntry = waitlists.find(
          (w) =>
            w.eventId === waitlistData.eventId &&
            w.attendeeId === waitlistData.attendeeId &&
            w.status === 'WAITING'
        );

        if (existingEntry) {
          throw new Error('You are already on the waitlist for this event');
        }

        const waitlistEntry: Waitlist = {
          id: this.generateId('waitlist'),
          eventId: waitlistData.eventId,
          attendeeId: waitlistData.attendeeId,
          email: waitlistData.email,
          phoneNumber: waitlistData.phoneNumber,
          ticketType: waitlistData.ticketType,
          quantity: waitlistData.quantity,
          joinedAt: new Date(),
          status: 'WAITING',
        };

        this.storageService.addToCollection('waitlists', waitlistEntry);

        // Send confirmation notification
        this.sendWaitlistConfirmation(waitlistEntry);

        return waitlistEntry;
      })
    );
  }

  leaveWaitlist(waitlistId: string): Observable<boolean> {
    return of(null).pipe(
      delay(200),
      map(() => {
        this.storageService.removeFromCollection('waitlists', waitlistId);
        return true;
      })
    );
  }

  notifyWaitlistedAttendees(eventId: string): Observable<boolean> {
    return of(null).pipe(
      delay(500),
      map(() => {
        const waitlists: Waitlist[] = this.storageService.get('waitlists') || [];
        const eventWaitlist = waitlists
          .filter((w) => w.eventId === eventId && w.status === 'WAITING')
          .sort((a, b) => a.joinedAt.getTime() - b.joinedAt.getTime()); // FIFO order

        if (eventWaitlist.length === 0) {
          return false;
        }

        // Notify first person on waitlist
        const nextInLine = eventWaitlist[0];

        this.storageService.updateInCollection('waitlists', nextInLine.id, {
          status: 'NOTIFIED',
          notifiedAt: new Date(),
        });

        // Send notification
        this.sendTicketAvailableNotification(nextInLine);

        return true;
      })
    );
  }

  getWaitlistByEvent(eventId: string): Observable<Waitlist[]> {
    return of(null).pipe(
      delay(200),
      map(() => {
        return this.storageService
          .filterCollection('waitlists', (w: Waitlist) => w.eventId === eventId)
          .sort((a: Waitlist, b: Waitlist) => a.joinedAt.getTime() - b.joinedAt.getTime());
      })
    );
  }

  getWaitlistByAttendee(attendeeId: string): Observable<Waitlist[]> {
    return of(null).pipe(
      delay(200),
      map(() => {
        return this.storageService.filterCollection(
          'waitlists',
          (w: Waitlist) => w.attendeeId === attendeeId
        );
      })
    );
  }

  getWaitlistPosition(waitlistId: string): Observable<number> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const waitlist = this.storageService.findInCollection(
          'waitlists',
          (w: Waitlist) => w.id === waitlistId
        );

        if (!waitlist) {
          return -1;
        }

        const eventWaitlist = this.storageService
          .filterCollection(
            'waitlists',
            (w: Waitlist) => w.eventId === waitlist.eventId && w.status === 'WAITING'
          )
          .sort((a: Waitlist, b: Waitlist) => a.joinedAt.getTime() - b.joinedAt.getTime());

        return eventWaitlist.findIndex((w: Waitlist) => w.id === waitlistId) + 1;
      })
    );
  }

  convertWaitlistToBooking(waitlistId: string): Observable<boolean> {
    return of(null).pipe(
      delay(200),
      map(() => {
        this.storageService.updateInCollection('waitlists', waitlistId, {
          status: 'CONVERTED',
        });
        return true;
      })
    );
  }

  expireWaitlistEntry(waitlistId: string): Observable<boolean> {
    return of(null).pipe(
      delay(200),
      map(() => {
        this.storageService.updateInCollection('waitlists', waitlistId, {
          status: 'EXPIRED',
        });
        return true;
      })
    );
  }

  notifyWaitlistEventApproaching(eventId: string): Observable<boolean> {
    return of(null).pipe(
      delay(300),
      map(() => {
        const waitlists: Waitlist[] = this.storageService.get('waitlists') || [];
        const activeWaitlist = waitlists.filter(
          (w) => w.eventId === eventId && w.status === 'WAITING'
        );

        activeWaitlist.forEach((waitlist) => {
          this.sendEventApproachingNotification(waitlist);
        });

        return true;
      })
    );
  }

  private sendWaitlistConfirmation(waitlist: Waitlist): void {
    const message = `
      You have successfully joined the waitlist!
      
      Event ID: ${waitlist.eventId}
      Ticket Type: ${waitlist.ticketType}
      Quantity: ${waitlist.quantity}
      
      We will notify you via email if tickets become available.
      
      Thank you for your patience!
      HELP Events Team
    `;

    this.notificationService.sendNotification({
      userId: waitlist.attendeeId,
      type: 'EMAIL',
      subject: 'Waitlist Confirmation',
      message: message,
    });
  }

  private sendTicketAvailableNotification(waitlist: Waitlist): void {
    const message = `
      Good news! Tickets are now available for your waitlisted event!
      
      Event ID: ${waitlist.eventId}
      Ticket Type: ${waitlist.ticketType}
      Quantity: ${waitlist.quantity}
      
      Please log in to complete your booking within the next 24 hours.
      This is a first-come, first-served opportunity.
      
      Book Now: https://helpevents.com/events/${waitlist.eventId}
      
      HELP Events Team
    `;

    this.notificationService.sendNotification({
      userId: waitlist.attendeeId,
      type: 'EMAIL',
      subject: 'Tickets Available - Waitlist Notification',
      message: message,
    });
  }

  private sendEventApproachingNotification(waitlist: Waitlist): void {
    const message = `
      The event you are waitlisted for is approaching.
      
      Event ID: ${waitlist.eventId}
      
      Unfortunately, no tickets have become available.
      We apologize for any inconvenience.
      
      Please check our website for other upcoming events.
      
      HELP Events Team
    `;

    this.notificationService.sendNotification({
      userId: waitlist.attendeeId,
      type: 'EMAIL',
      subject: 'Event Approaching - Waitlist Update',
      message: message,
    });
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
