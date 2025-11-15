// src/app/components/organizer/manage-events/manage-events.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { EventService } from '../../../services/event.service';
import { AuthService } from '../../../services/auth.service';
import { Event, EventStatus } from '../../../models/models';

import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-manage-events',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatChipsModule,
  ],
  templateUrl: './manage-events.component.html',
  styleUrls: ['./manage-events.component.scss'],
})
export class ManageEventsComponent implements OnInit {
  events: Event[] = [];
  loading = true;

  constructor(
    private eventService: EventService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return;

    this.eventService.getEventsByOrganizer(currentUser.id).subscribe({
      next: (events) => {
        this.events = events.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.loading = false;
      },
    });
  }

  viewEvent(eventId: string): void {
    this.router.navigate(['/organizer/event', eventId]);
  }

  createEvent(): void {
    this.router.navigate(['/organizer/create-event']);
  }
}
