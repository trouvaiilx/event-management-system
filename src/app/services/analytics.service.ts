// src/app/services/analytics.service.ts

import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import {
  TicketSalesReport,
  RevenueReport,
  SeatOccupancyReport,
  AuditoriumUsageReport,
  Event,
  Booking,
  BookingStatus,
  TicketType,
  SeatSection,
  User,
} from '../models/models';
import { StorageService } from './storage.service';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from 'date-fns';

@Injectable({
  providedIn: 'root',
})
export class AnalyticsService {
  constructor(private storageService: StorageService) {}

  // UC7: Analytics Reports - Ticket Sales Report
  getTicketSalesReport(
    eventId: string,
    period: 'daily' | 'weekly' | 'monthly',
    date: Date = new Date()
  ): Observable<TicketSalesReport> {
    return of(null).pipe(
      delay(500),
      map(() => {
        const event: Event = this.storageService.findInCollection(
          'events',
          (e: Event) => e.id === eventId
        );

        if (!event) {
          throw new Error('Event not found');
        }

        const bookings = this.getBookingsInPeriod(eventId, period, date);

        const ticketsByType = this.calculateTicketsByType(bookings);
        const totalTicketsSold = bookings.reduce((sum, b) => sum + b.seats.length, 0);
        const totalRevenue = bookings.reduce((sum, b) => sum + b.finalAmount, 0);
        const averageTicketPrice = totalTicketsSold > 0 ? totalRevenue / totalTicketsSold : 0;

        const report: TicketSalesReport = {
          eventId,
          eventName: event.name,
          period: this.formatPeriod(period, date),
          totalTicketsSold,
          ticketsByType,
          totalRevenue,
          averageTicketPrice,
        };

        return report;
      })
    );
  }

  // Revenue Report
  getRevenueReport(
    period: 'daily' | 'weekly' | 'monthly',
    date: Date = new Date(),
    organizerId?: string
  ): Observable<RevenueReport> {
    return of(null).pipe(
      delay(500),
      map(() => {
        const { start, end } = this.getPeriodRange(period, date);

        let events: Event[] = this.storageService.get('events') || [];
        if (organizerId) {
          events = events.filter((e) => e.organizerId === organizerId);
        }

        const bookings: Booking[] = this.storageService.get('bookings') || [];
        const periodBookings = bookings.filter(
          (b) =>
            b.status === BookingStatus.CONFIRMED && isWithinInterval(b.createdAt, { start, end })
        );

        const totalRevenue = periodBookings.reduce((sum, b) => sum + b.finalAmount, 0);

        const revenueByEvent = events
          .map((event) => {
            const eventBookings = periodBookings.filter((b) => b.eventId === event.id);
            return {
              eventId: event.id,
              eventName: event.name,
              revenue: eventBookings.reduce((sum, b) => sum + b.finalAmount, 0),
              ticketsSold: eventBookings.reduce((sum, b) => sum + b.seats.length, 0),
            };
          })
          .filter((e) => e.revenue > 0);

        const revenueByTicketType = this.calculateRevenueByTicketType(periodBookings);

        const report: RevenueReport = {
          period: this.formatPeriod(period, date),
          totalRevenue,
          revenueByEvent,
          revenueByTicketType,
        };

        return report;
      })
    );
  }

  // Seat Occupancy Report
  getSeatOccupancyReport(eventId: string): Observable<SeatOccupancyReport> {
    return of(null).pipe(
      delay(500),
      map(() => {
        const event: Event = this.storageService.findInCollection(
          'events',
          (e: Event) => e.id === eventId
        );

        if (!event) {
          throw new Error('Event not found');
        }

        const seats = this.storageService.filterCollection(
          'seats',
          (s: any) => s.eventId === eventId
        );

        const totalSeats = seats.length;
        const occupiedSeats = seats.filter((s: any) => !s.isAvailable).length;
        const occupancyRate = totalSeats > 0 ? (occupiedSeats / totalSeats) * 100 : 0;

        const occupancyBySection = this.calculateOccupancyBySection(seats);

        const report: SeatOccupancyReport = {
          eventId,
          eventName: event.name,
          totalSeats,
          occupiedSeats,
          occupancyRate,
          occupancyBySection,
        };

        return report;
      })
    );
  }

  // Auditorium Usage Report (Admin only)
  getAuditoriumUsageReport(
    period: 'weekly' | 'monthly',
    date: Date = new Date()
  ): Observable<AuditoriumUsageReport> {
    return of(null).pipe(
      delay(500),
      map(() => {
        const { start, end } = this.getPeriodRange(period, date);

        const events: Event[] = this.storageService.get('events') || [];
        const periodEvents = events.filter((e) => isWithinInterval(e.date, { start, end }));

        const bookings: Booking[] = this.storageService.get('bookings') || [];
        const periodBookings = bookings.filter(
          (b) =>
            b.status === BookingStatus.CONFIRMED && periodEvents.some((e) => e.id === b.eventId)
        );

        const totalEvents = periodEvents.length;
        const totalBookings = periodBookings.length;
        const totalRevenue = periodBookings.reduce((sum, b) => sum + b.finalAmount, 0);

        // Calculate average occupancy
        const occupancyRates = periodEvents.map((event) => {
          const eventSeats = this.storageService.filterCollection(
            'seats',
            (s: any) => s.eventId === event.id
          );
          const total = eventSeats.length;
          const occupied = eventSeats.filter((s: any) => !s.isAvailable).length;
          return total > 0 ? (occupied / total) * 100 : 0;
        });
        const averageOccupancy =
          occupancyRates.length > 0
            ? occupancyRates.reduce((sum, rate) => sum + rate, 0) / occupancyRates.length
            : 0;

        const eventsByOrganizer = this.calculateEventsByOrganizer(periodEvents, periodBookings);

        const report: AuditoriumUsageReport = {
          period: this.formatPeriod(period, date),
          totalEvents,
          totalBookings,
          totalRevenue,
          averageOccupancy,
          eventsByOrganizer,
        };

        return report;
      })
    );
  }

  private getBookingsInPeriod(
    eventId: string,
    period: 'daily' | 'weekly' | 'monthly',
    date: Date
  ): Booking[] {
    const { start, end } = this.getPeriodRange(period, date);
    const bookings: Booking[] = this.storageService.get('bookings') || [];

    return bookings.filter(
      (b) =>
        b.eventId === eventId &&
        b.status === BookingStatus.CONFIRMED &&
        isWithinInterval(b.createdAt, { start, end })
    );
  }

  private getPeriodRange(
    period: 'daily' | 'weekly' | 'monthly',
    date: Date
  ): { start: Date; end: Date } {
    switch (period) {
      case 'daily':
        return { start: startOfDay(date), end: endOfDay(date) };
      case 'weekly':
        return { start: startOfWeek(date), end: endOfWeek(date) };
      case 'monthly':
        return { start: startOfMonth(date), end: endOfMonth(date) };
    }
  }

  private formatPeriod(period: 'daily' | 'weekly' | 'monthly', date: Date): string {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = date.toLocaleDateString('en-US', options);

    switch (period) {
      case 'daily':
        return dateStr;
      case 'weekly':
        const weekStart = startOfWeek(date);
        const weekEnd = endOfWeek(date);
        return `${weekStart.toLocaleDateString('en-US', options)} - ${weekEnd.toLocaleDateString(
          'en-US',
          options
        )}`;
      case 'monthly':
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
  }

  private calculateTicketsByType(bookings: Booking[]): {
    type: TicketType;
    quantity: number;
    revenue: number;
  }[] {
    const typeMap = new Map<TicketType, { quantity: number; revenue: number }>();

    bookings.forEach((booking) => {
      booking.seats.forEach((seat) => {
        const current = typeMap.get(seat.ticketType) || { quantity: 0, revenue: 0 };
        typeMap.set(seat.ticketType, {
          quantity: current.quantity + 1,
          revenue: current.revenue + seat.price,
        });
      });
    });

    return Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      ...data,
    }));
  }

  private calculateRevenueByTicketType(bookings: Booking[]): {
    type: TicketType;
    revenue: number;
  }[] {
    const typeMap = new Map<TicketType, number>();

    bookings.forEach((booking) => {
      booking.seats.forEach((seat) => {
        const current = typeMap.get(seat.ticketType) || 0;
        typeMap.set(seat.ticketType, current + seat.price);
      });
    });

    return Array.from(typeMap.entries()).map(([type, revenue]) => ({
      type,
      revenue,
    }));
  }

  private calculateOccupancyBySection(seats: any[]): {
    section: SeatSection;
    total: number;
    occupied: number;
    rate: number;
  }[] {
    const sections = [SeatSection.FRONT, SeatSection.MIDDLE, SeatSection.BACK];

    return sections.map((section) => {
      const sectionSeats = seats.filter((s) => s.section === section);
      const total = sectionSeats.length;
      const occupied = sectionSeats.filter((s) => !s.isAvailable).length;
      const rate = total > 0 ? (occupied / total) * 100 : 0;

      return { section, total, occupied, rate };
    });
  }

  private calculateEventsByOrganizer(
    events: Event[],
    bookings: Booking[]
  ): {
    organizerId: string;
    organizerName: string;
    eventCount: number;
    revenue: number;
  }[] {
    const organizerMap = new Map<string, { eventCount: number; revenue: number }>();
    const users: User[] = this.storageService.get('users') || [];

    events.forEach((event) => {
      const eventBookings = bookings.filter((b) => b.eventId === event.id);
      const revenue = eventBookings.reduce((sum, b) => sum + b.finalAmount, 0);

      const current = organizerMap.get(event.organizerId) || { eventCount: 0, revenue: 0 };
      organizerMap.set(event.organizerId, {
        eventCount: current.eventCount + 1,
        revenue: current.revenue + revenue,
      });
    });

    return Array.from(organizerMap.entries()).map(([organizerId, data]) => {
      const organizer = users.find((u) => u.id === organizerId);
      return {
        organizerId,
        organizerName: organizer?.fullName || 'Unknown',
        ...data,
      };
    });
  }
}
