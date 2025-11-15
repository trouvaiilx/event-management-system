// src/app/services/event.service.ts

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import {
  Event,
  EventStatus,
  TicketCategory,
  TicketType,
  SeatSection,
  Seat,
  PromotionalCode,
} from '../models/models';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class EventService {
  constructor(private storageService: StorageService) {}

  // UC2: Event Creation
  createEvent(eventData: {
    name: string;
    description: string;
    date: Date;
    startTime: string;
    endTime: string;
    location: string;
    posterUrl?: string;
    organizerId: string;
  }): Observable<Event> {
    return of(null).pipe(
      delay(500),
      map(() => {
        const events: Event[] = this.storageService.get('events') || [];

        // Check if date is already booked
        const existingEvent = events.find(
          (e) =>
            e.date.toDateString() === eventData.date.toDateString() &&
            e.status !== EventStatus.CANCELLED
        );

        if (existingEvent) {
          throw new Error('This date is already booked for another event');
        }

        const newEvent: Event = {
          id: this.generateId('event'),
          organizerId: eventData.organizerId,
          name: eventData.name,
          description: eventData.description,
          date: eventData.date,
          startTime: eventData.startTime,
          endTime: eventData.endTime,
          location: eventData.location,
          posterUrl: eventData.posterUrl,
          status: EventStatus.DRAFT,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        this.storageService.addToCollection('events', newEvent);
        return newEvent;
      })
    );
  }

  // UC3: Ticket Setup
  addTicketCategory(categoryData: {
    eventId: string;
    type: TicketType;
    price: number;
    quantity: number;
    section: SeatSection;
    restrictions?: string;
    maxPerBooking?: number;
  }): Observable<TicketCategory> {
    return of(null).pipe(
      delay(300),
      map(() => {
        const category: TicketCategory = {
          id: this.generateId('ticket-cat'),
          eventId: categoryData.eventId,
          type: categoryData.type,
          price: categoryData.price,
          quantity: categoryData.quantity,
          availableQuantity: categoryData.quantity,
          section: categoryData.section,
          restrictions: categoryData.restrictions,
          maxPerBooking: categoryData.maxPerBooking || 10,
        };

        this.storageService.addToCollection('ticketCategories', category);

        // Generate seats for this category
        this.generateSeatsForCategory(category);

        return category;
      })
    );
  }

  private generateSeatsForCategory(category: TicketCategory): void {
    const seats: Seat[] = [];
    const seatsPerRow = 10;
    const numberOfRows = Math.ceil(category.quantity / seatsPerRow);

    const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let seatCount = 0;

    for (let row = 0; row < numberOfRows && seatCount < category.quantity; row++) {
      for (let seatNum = 1; seatNum <= seatsPerRow && seatCount < category.quantity; seatNum++) {
        const seat: Seat = {
          id: this.generateId('seat'),
          eventId: category.eventId,
          section: category.section,
          row: rowLetters[row % rowLetters.length],
          number: seatNum,
          ticketCategoryId: category.id,
          isAvailable: true,
          isReserved: false,
        };
        seats.push(seat);
        seatCount++;
      }
    }

    // Add all seats to storage
    const existingSeats = this.storageService.get('seats') || [];
    this.storageService.set('seats', [...existingSeats, ...seats]);
  }

  setupSeatingLayout(
    eventId: string,
    sections: {
      section: SeatSection;
      ticketCategoryId: string;
    }[]
  ): Observable<boolean> {
    return of(true).pipe(delay(200));
  }

  createPromotionalCode(promoData: {
    eventId: string;
    code: string;
    discountPercentage: number;
    discountAmount?: number;
    validFrom: Date;
    validUntil: Date;
    usageLimit?: number;
    applicableTicketTypes?: TicketType[];
  }): Observable<PromotionalCode> {
    return of(null).pipe(
      delay(300),
      map(() => {
        const promo: PromotionalCode = {
          id: this.generateId('promo'),
          eventId: promoData.eventId,
          code: promoData.code.toUpperCase(),
          discountPercentage: promoData.discountPercentage,
          discountAmount: promoData.discountAmount,
          validFrom: promoData.validFrom,
          validUntil: promoData.validUntil,
          usageLimit: promoData.usageLimit,
          usageCount: 0,
          applicableTicketTypes: promoData.applicableTicketTypes,
          isActive: true,
        };

        this.storageService.addToCollection('promotionalCodes', promo);
        return promo;
      })
    );
  }

  publishEvent(eventId: string): Observable<Event> {
    return this.updateEvent(eventId, { status: EventStatus.PUBLISHED });
  }

  updateEvent(eventId: string, updates: Partial<Event>): Observable<Event> {
    return of(null).pipe(
      delay(300),
      map(() => {
        const updateData = { ...updates, updatedAt: new Date() };
        this.storageService.updateInCollection('events', eventId, updateData);
        return this.storageService.findInCollection('events', (e: Event) => e.id === eventId);
      })
    );
  }

  getEventById(eventId: string): Observable<Event> {
    return of(null).pipe(
      delay(200),
      map(() => {
        return this.storageService.findInCollection('events', (e: Event) => e.id === eventId);
      })
    );
  }

  getAllEvents(): Observable<Event[]> {
    return of(this.storageService.get('events') || []).pipe(delay(200));
  }

  getEventsByOrganizer(organizerId: string): Observable<Event[]> {
    return of(null).pipe(
      delay(200),
      map(() => {
        return this.storageService.filterCollection(
          'events',
          (e: Event) => e.organizerId === organizerId
        );
      })
    );
  }

  getPublishedEvents(): Observable<Event[]> {
    return of(null).pipe(
      delay(200),
      map(() => {
        return this.storageService.filterCollection(
          'events',
          (e: Event) => e.status === EventStatus.PUBLISHED
        );
      })
    );
  }

  getTicketCategoriesByEvent(eventId: string): Observable<TicketCategory[]> {
    return of(null).pipe(
      delay(200),
      map(() => {
        return this.storageService.filterCollection(
          'ticketCategories',
          (tc: TicketCategory) => tc.eventId === eventId
        );
      })
    );
  }

  getSeatsByEvent(eventId: string): Observable<Seat[]> {
    return of(null).pipe(
      delay(200),
      map(() => {
        return this.storageService.filterCollection('seats', (s: Seat) => s.eventId === eventId);
      })
    );
  }

  getAvailableSeats(eventId: string, ticketCategoryId?: string): Observable<Seat[]> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const seats: Seat[] = this.storageService.get('seats') || [];
        return seats.filter(
          (s) =>
            s.eventId === eventId &&
            s.isAvailable &&
            !s.isReserved &&
            (!ticketCategoryId || s.ticketCategoryId === ticketCategoryId)
        );
      })
    );
  }

  getPromotionalCodesByEvent(eventId: string): Observable<PromotionalCode[]> {
    return of(null).pipe(
      delay(200),
      map(() => {
        return this.storageService.filterCollection(
          'promotionalCodes',
          (pc: PromotionalCode) => pc.eventId === eventId && pc.isActive
        );
      })
    );
  }

  validatePromotionalCode(code: string, eventId: string): Observable<PromotionalCode | null> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const promos: PromotionalCode[] = this.storageService.get('promotionalCodes') || [];
        const promo = promos.find(
          (p) =>
            p.code === code.toUpperCase() &&
            p.eventId === eventId &&
            p.isActive &&
            new Date() >= p.validFrom &&
            new Date() <= p.validUntil &&
            (!p.usageLimit || p.usageCount < p.usageLimit)
        );
        return promo || null;
      })
    );
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
