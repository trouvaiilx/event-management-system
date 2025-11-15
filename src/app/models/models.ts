// src/app/models/models.ts

export enum UserRole {
  ADMIN = 'ADMIN',
  EVENT_ORGANIZER = 'EVENT_ORGANIZER',
  ATTENDEE = 'ATTENDEE',
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TicketType {
  GENERAL_ADMISSION = 'GENERAL_ADMISSION',
  VIP = 'VIP',
  SENIOR_CITIZEN = 'SENIOR_CITIZEN',
  CHILD = 'CHILD',
}

export enum SeatSection {
  FRONT = 'FRONT',
  MIDDLE = 'MIDDLE',
  BACK = 'BACK',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  CHECKED_IN = 'CHECKED_IN',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  E_WALLET = 'E_WALLET',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  fullName: string;
  phoneNumber: string;
  organizationName?: string;
  createdAt: Date;
  mustChangePassword: boolean;
  isActive: boolean;
}

export interface Event {
  id: string;
  organizerId: string;
  name: string;
  description: string;
  date: Date;
  startTime: string;
  endTime: string;
  location: string;
  posterUrl?: string;
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketCategory {
  id: string;
  eventId: string;
  type: TicketType;
  price: number;
  quantity: number;
  availableQuantity: number;
  section: SeatSection;
  restrictions?: string;
  maxPerBooking?: number;
}

export interface Seat {
  id: string;
  eventId: string;
  section: SeatSection;
  row: string;
  number: number;
  ticketCategoryId: string;
  isAvailable: boolean;
  isReserved: boolean;
  reservedUntil?: Date;
}

export interface PromotionalCode {
  id: string;
  eventId: string;
  code: string;
  discountPercentage: number;
  discountAmount?: number;
  validFrom: Date;
  validUntil: Date;
  usageLimit?: number;
  usageCount: number;
  applicableTicketTypes?: TicketType[];
  isActive: boolean;
}

export interface Booking {
  id: string;
  attendeeId: string;
  eventId: string;
  seats: BookingSeat[];
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  promoCode?: string;
  status: BookingStatus;
  qrCode?: string;
  createdAt: Date;
  checkedInAt?: Date;
}

export interface BookingSeat {
  seatId: string;
  ticketCategoryId: string;
  ticketType: TicketType;
  section: SeatSection;
  row: string;
  number: number;
  price: number;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  paymentDate?: Date;
  cardLastFour?: string;
  createdAt: Date;
}

export interface Waitlist {
  id: string;
  eventId: string;
  attendeeId: string;
  email: string;
  phoneNumber: string;
  ticketType: TicketType;
  quantity: number;
  joinedAt: Date;
  notifiedAt?: Date;
  status: 'WAITING' | 'NOTIFIED' | 'CONVERTED' | 'EXPIRED';
}

export interface Notification {
  id: string;
  userId: string;
  type: 'EMAIL' | 'SMS' | 'IN_APP';
  subject: string;
  message: string;
  sentAt: Date;
  isRead: boolean;
}

// Analytics Interfaces
export interface TicketSalesReport {
  eventId: string;
  eventName: string;
  period: string;
  totalTicketsSold: number;
  ticketsByType: {
    type: TicketType;
    quantity: number;
    revenue: number;
  }[];
  totalRevenue: number;
  averageTicketPrice: number;
}

export interface RevenueReport {
  period: string;
  totalRevenue: number;
  revenueByEvent: {
    eventId: string;
    eventName: string;
    revenue: number;
    ticketsSold: number;
  }[];
  revenueByTicketType: {
    type: TicketType;
    revenue: number;
  }[];
}

export interface SeatOccupancyReport {
  eventId: string;
  eventName: string;
  totalSeats: number;
  occupiedSeats: number;
  occupancyRate: number;
  occupancyBySection: {
    section: SeatSection;
    total: number;
    occupied: number;
    rate: number;
  }[];
}

export interface AuditoriumUsageReport {
  period: string;
  totalEvents: number;
  totalBookings: number;
  totalRevenue: number;
  averageOccupancy: number;
  eventsByOrganizer: {
    organizerId: string;
    organizerName: string;
    eventCount: number;
    revenue: number;
  }[];
}
