// src/app/components/attendee/event-view/event-view.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../../services/event.service';
import { Event, TicketCategory } from '../../../models/models';

import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-event-view',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
  ],
  templateUrl: './event-view.component.html',
  styleUrls: ['./event-view.component.scss'],
})
export class EventViewComponent implements OnInit {
  eventId: string = '';
  event: Event | null = null;
  ticketCategories: TicketCategory[] = [];
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService
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

  bookTickets(): void {
    this.router.navigate(['/attendee/event', this.eventId, 'seats']);
  }

  goBack(): void {
    this.router.navigate(['/attendee/browse-events']);
  }
}
