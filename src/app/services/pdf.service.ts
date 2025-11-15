// src/app/services/pdf.service.ts

import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  TicketSalesReport,
  RevenueReport,
  SeatOccupancyReport,
  AuditoriumUsageReport,
  Booking,
} from '../models/models';

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  constructor() {}

  generateTicketSalesReport(report: TicketSalesReport): void {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text('Ticket Sales Report', 14, 20);

    // Event Info
    doc.setFontSize(12);
    doc.text(`Event: ${report.eventName}`, 14, 30);
    doc.text(`Period: ${report.period}`, 14, 37);

    // Summary
    doc.setFontSize(11);
    doc.text(`Total Tickets Sold: ${report.totalTicketsSold}`, 14, 47);
    doc.text(`Total Revenue: $${report.totalRevenue.toFixed(2)}`, 14, 54);
    doc.text(`Average Ticket Price: $${report.averageTicketPrice.toFixed(2)}`, 14, 61);

    // Tickets by Type Table
    const tableData = report.ticketsByType.map((item) => [
      item.type,
      item.quantity.toString(),
      `$${item.revenue.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['Ticket Type', 'Quantity', 'Revenue']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [63, 81, 181] },
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.height - 10);
    doc.text(
      `Page 1 of ${pageCount}`,
      doc.internal.pageSize.width - 30,
      doc.internal.pageSize.height - 10
    );

    doc.save(`ticket-sales-report-${Date.now()}.pdf`);
  }

  generateRevenueReport(report: RevenueReport): void {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text('Revenue Report', 14, 20);

    // Period Info
    doc.setFontSize(12);
    doc.text(`Period: ${report.period}`, 14, 30);
    doc.text(`Total Revenue: $${report.totalRevenue.toFixed(2)}`, 14, 37);

    // Revenue by Event Table
    if (report.revenueByEvent.length > 0) {
      doc.setFontSize(14);
      doc.text('Revenue by Event', 14, 50);

      const eventData = report.revenueByEvent.map((item) => [
        item.eventName,
        item.ticketsSold.toString(),
        `$${item.revenue.toFixed(2)}`,
      ]);

      autoTable(doc, {
        startY: 55,
        head: [['Event Name', 'Tickets Sold', 'Revenue']],
        body: eventData,
        theme: 'grid',
        headStyles: { fillColor: [63, 81, 181] },
      });
    }

    // Revenue by Ticket Type Table
    const finalY = (doc as any).lastAutoTable?.finalY || 65;
    doc.setFontSize(14);
    doc.text('Revenue by Ticket Type', 14, finalY + 15);

    const typeData = report.revenueByTicketType.map((item) => [
      item.type,
      `$${item.revenue.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: finalY + 20,
      head: [['Ticket Type', 'Revenue']],
      body: typeData,
      theme: 'grid',
      headStyles: { fillColor: [63, 81, 181] },
    });

    // Footer
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.height - 10);

    doc.save(`revenue-report-${Date.now()}.pdf`);
  }

  generateSeatOccupancyReport(report: SeatOccupancyReport): void {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text('Seat Occupancy Report', 14, 20);

    // Event Info
    doc.setFontSize(12);
    doc.text(`Event: ${report.eventName}`, 14, 30);

    // Summary
    doc.setFontSize(11);
    doc.text(`Total Seats: ${report.totalSeats}`, 14, 40);
    doc.text(`Occupied Seats: ${report.occupiedSeats}`, 14, 47);
    doc.text(`Occupancy Rate: ${report.occupancyRate.toFixed(2)}%`, 14, 54);

    // Occupancy by Section Table
    const sectionData = report.occupancyBySection.map((item) => [
      item.section,
      item.total.toString(),
      item.occupied.toString(),
      `${item.rate.toFixed(2)}%`,
    ]);

    autoTable(doc, {
      startY: 65,
      head: [['Section', 'Total Seats', 'Occupied', 'Occupancy Rate']],
      body: sectionData,
      theme: 'grid',
      headStyles: { fillColor: [63, 81, 181] },
    });

    // Footer
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.height - 10);

    doc.save(`seat-occupancy-report-${Date.now()}.pdf`);
  }

  generateAuditoriumUsageReport(report: AuditoriumUsageReport): void {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.text('Auditorium Usage Report', 14, 20);

    // Period Info
    doc.setFontSize(12);
    doc.text(`Period: ${report.period}`, 14, 30);

    // Summary
    doc.setFontSize(11);
    doc.text(`Total Events: ${report.totalEvents}`, 14, 40);
    doc.text(`Total Bookings: ${report.totalBookings}`, 14, 47);
    doc.text(`Total Revenue: $${report.totalRevenue.toFixed(2)}`, 14, 54);
    doc.text(`Average Occupancy: ${report.averageOccupancy.toFixed(2)}%`, 14, 61);

    // Events by Organizer Table
    const organizerData = report.eventsByOrganizer.map((item) => [
      item.organizerName,
      item.eventCount.toString(),
      `$${item.revenue.toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['Organizer', 'Event Count', 'Revenue']],
      body: organizerData,
      theme: 'grid',
      headStyles: { fillColor: [63, 81, 181] },
    });

    // Footer
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.height - 10);

    doc.save(`auditorium-usage-report-${Date.now()}.pdf`);
  }

  generateTicket(
    booking: Booking,
    eventName: string,
    eventDate: Date,
    qrCodeDataUrl: string
  ): void {
    const doc = new jsPDF();

    // Ticket Design
    doc.setFillColor(63, 81, 181);
    doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('EVENT TICKET', doc.internal.pageSize.width / 2, 25, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('HELP Events', doc.internal.pageSize.width / 2, 55, { align: 'center' });

    // Event Details
    doc.setFontSize(14);
    doc.text(`Event: ${eventName}`, 20, 75);
    doc.text(`Date: ${eventDate.toLocaleDateString()}`, 20, 85);
    doc.text(`Booking ID: ${booking.id}`, 20, 95);

    // Seats
    doc.setFontSize(12);
    doc.text('Seats:', 20, 110);
    booking.seats.forEach((seat, index) => {
      doc.text(
        `${index + 1}. ${seat.section} - Row ${seat.row}, Seat ${seat.number} (${seat.ticketType})`,
        25,
        120 + index * 7
      );
    });

    // QR Code
    if (qrCodeDataUrl) {
      doc.addImage(qrCodeDataUrl, 'PNG', doc.internal.pageSize.width - 70, 70, 50, 50);
    }

    // Footer
    doc.setFontSize(10);
    doc.text(
      'Please present this ticket at the entrance',
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 20,
      { align: 'center' }
    );
    doc.text(
      'Thank you for choosing HELP Events',
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 13,
      { align: 'center' }
    );

    doc.save(`ticket-${booking.id}.pdf`);
  }
}
