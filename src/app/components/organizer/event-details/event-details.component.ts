// src/app/components/organizer/event-details/event-details.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EventService } from '../../../services/event.service';
import { Event, TicketCategory } from '../../../models/models';

import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatTableModule,
    MatSnackBarModule,
  ],
  templateUrl: './event-details.component.html',
  styleUrls: ['./event-details.component.scss'],
})
export class EventDetailsComponent implements OnInit {
  eventId: string = '';
  event: Event | null = null;
  ticketCategories: TicketCategory[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('id') || '';
    this.loadEvent();
  }

  loadEvent(): void {
    this.eventService.getEventById(this.eventId).subscribe({
      next: (event) => {
        this.event = event;
      },
      error: (error) => console.error('Error loading event:', error),
    });

    this.eventService.getTicketCategoriesByEvent(this.eventId).subscribe({
      next: (categories) => {
        this.ticketCategories = categories;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading tickets:', error);
        this.loading = false;
      },
    });
  }

  navigateToTickets(): void {
    this.router.navigate(['/organizer/event', this.eventId, 'tickets']);
  }

  navigateToPromos(): void {
    this.router.navigate(['/organizer/event', this.eventId, 'promo-codes']);
  }

  navigateToAnalytics(): void {
    this.router.navigate(['/organizer/event', this.eventId, 'analytics']);
  }

  goBack(): void {
    this.router.navigate(['/organizer/manage-events']);
  }
}
