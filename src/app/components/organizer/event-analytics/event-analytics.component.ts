// src/app/components/organizer/event-analytics/event-analytics.component.ts

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AnalyticsService } from '../../../services/analytics.service';
import { EventService } from '../../../services/event.service';
import { PdfService } from '../../../services/pdf.service';
import { Event, TicketSalesReport, SeatOccupancyReport } from '../../../models/models';
import { ChartData, ChartOptions, ChartType } from 'chart.js';

@Component({
  selector: 'app-event-analytics',
  templateUrl: './event-analytics.component.html',
  styleUrls: ['./event-analytics.component.scss'],
})
export class EventAnalyticsComponent implements OnInit {
  eventId: string = '';
  event: Event | null = null;
  loading = true;

  period: 'daily' | 'weekly' | 'monthly' = 'daily';
  selectedDate = new Date();

  ticketSalesReport: TicketSalesReport | null = null;
  occupancyReport: SeatOccupancyReport | null = null;

  // Chart configurations
  salesChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  salesChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'top' },
      title: { display: true, text: 'Ticket Sales by Type' },
    },
    scales: {
      y: { beginAtZero: true, ticks: { precision: 0 } },
    },
  };

  revenueChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  revenueChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    plugins: {
      legend: { display: true, position: 'right' },
      title: { display: true, text: 'Revenue Distribution' },
    },
  };

  occupancyChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  occupancyChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Occupancy by Section' },
    },
    scales: {
      y: { beginAtZero: true, max: 100, ticks: { callback: (value) => value + '%' } },
    },
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private analyticsService: AnalyticsService,
    private eventService: EventService,
    private pdfService: PdfService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('id') || '';
    this.loadEvent();
    this.loadReports();
  }

  loadEvent(): void {
    this.eventService.getEventById(this.eventId).subscribe({
      next: (event) => {
        this.event = event;
      },
      error: (error) => {
        console.error('Error loading event:', error);
      },
    });
  }

  loadReports(): void {
    this.loading = true;

    // Load ticket sales report
    this.analyticsService
      .getTicketSalesReport(this.eventId, this.period, this.selectedDate)
      .subscribe({
        next: (report) => {
          this.ticketSalesReport = report;
          this.updateSalesCharts();
        },
        error: (error) => {
          console.error('Error loading ticket sales report:', error);
        },
      });

    // Load occupancy report
    this.analyticsService.getSeatOccupancyReport(this.eventId).subscribe({
      next: (report) => {
        this.occupancyReport = report;
        this.updateOccupancyChart();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading occupancy report:', error);
        this.loading = false;
      },
    });
  }

  updateSalesCharts(): void {
    if (!this.ticketSalesReport) return;

    const ticketsByType = this.ticketSalesReport.ticketsByType;

    // Bar chart - Tickets sold by type
    this.salesChartData = {
      labels: ticketsByType.map((t) => this.formatTicketType(t.type)),
      datasets: [
        {
          label: 'Tickets Sold',
          data: ticketsByType.map((t) => t.quantity),
          backgroundColor: ['#2196f3', '#4caf50', '#ff9800', '#f44336'],
        },
      ],
    };

    // Doughnut chart - Revenue distribution
    this.revenueChartData = {
      labels: ticketsByType.map((t) => this.formatTicketType(t.type)),
      datasets: [
        {
          label: 'Revenue',
          data: ticketsByType.map((t) => t.revenue),
          backgroundColor: ['#2196f3', '#4caf50', '#ff9800', '#f44336'],
        },
      ],
    };
  }

  updateOccupancyChart(): void {
    if (!this.occupancyReport) return;

    this.occupancyChartData = {
      labels: this.occupancyReport.occupancyBySection.map((s) => this.formatSection(s.section)),
      datasets: [
        {
          label: 'Occupancy Rate (%)',
          data: this.occupancyReport.occupancyBySection.map((s) => s.rate),
          backgroundColor: ['#2196f3', '#4caf50', '#ff9800'],
        },
      ],
    };
  }

  onPeriodChange(): void {
    this.loadReports();
  }

  downloadTicketSalesReport(): void {
    if (this.ticketSalesReport) {
      this.pdfService.generateTicketSalesReport(this.ticketSalesReport);
      this.snackBar.open('Report downloaded successfully!', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar'],
      });
    }
  }

  downloadOccupancyReport(): void {
    if (this.occupancyReport) {
      this.pdfService.generateSeatOccupancyReport(this.occupancyReport);
      this.snackBar.open('Report downloaded successfully!', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar'],
      });
    }
  }

  formatTicketType(type: string): string {
    return type.replace(/_/g, ' ');
  }

  formatSection(section: string): string {
    return section.charAt(0).toUpperCase() + section.slice(1).toLowerCase();
  }

  goBack(): void {
    this.router.navigate(['/organizer/event', this.eventId]);
  }
}
