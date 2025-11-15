// src/app/components/attendee/browse-events/browse-events.component.ts

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { EventService } from '../../../services/event.service';
import { Event, EventStatus } from '../../../models/models';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-browse-events',
  templateUrl: './browse-events.component.html',
  styleUrls: ['./browse-events.component.scss'],
})
export class BrowseEventsComponent implements OnInit {
  events: Event[] = [];
  filteredEvents: Event[] = [];
  loading = true;
  searchControl = new FormControl('');

  sortBy: 'date' | 'name' | 'price' = 'date';
  sortOrder: 'asc' | 'desc' = 'asc';

  constructor(private eventService: EventService, private router: Router) {}

  ngOnInit(): void {
    this.loadEvents();
    this.setupSearch();
  }

  loadEvents(): void {
    this.loading = true;

    this.eventService.getPublishedEvents().subscribe({
      next: (events) => {
        // Filter only future events
        this.events = events.filter((e) => e.date >= new Date());
        this.filteredEvents = [...this.events];
        this.sortEvents();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading events:', error);
        this.loading = false;
      },
    });
  }

  setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((searchTerm) => {
        this.filterEvents(searchTerm || '');
      });
  }

  filterEvents(searchTerm: string): void {
    if (!searchTerm.trim()) {
      this.filteredEvents = [...this.events];
    } else {
      const term = searchTerm.toLowerCase();
      this.filteredEvents = this.events.filter(
        (event) =>
          event.name.toLowerCase().includes(term) ||
          event.description.toLowerCase().includes(term) ||
          event.location.toLowerCase().includes(term)
      );
    }
    this.sortEvents();
  }

  onSortChange(): void {
    this.sortEvents();
  }

  sortEvents(): void {
    this.filteredEvents.sort((a, b) => {
      let comparison = 0;

      switch (this.sortBy) {
        case 'date':
          comparison = a.date.getTime() - b.date.getTime();
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          // For price sorting, we would need ticket info
          // For now, sort by name as fallback
          comparison = a.name.localeCompare(b.name);
          break;
      }

      return this.sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.sortEvents();
  }

  viewEvent(eventId: string): void {
    this.router.navigate(['/attendee/event', eventId]);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  getDaysUntilEvent(eventDate: Date): number {
    const today = new Date();
    const event = new Date(eventDate);
    const diffTime = event.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  isEventSoon(eventDate: Date): boolean {
    const days = this.getDaysUntilEvent(eventDate);
    return days <= 7 && days > 0;
  }
}
