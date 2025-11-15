// src/app/components/attendee/waitlist/waitlist.component.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { WaitlistService } from '../../../services/waitlist.service';
import { EventService } from '../../../services/event.service';
import { AuthService } from '../../../services/auth.service';
import { Waitlist, Event, TicketType } from '../../../models/models';

@Component({
  selector: 'app-waitlist',
  templateUrl: './waitlist.component.html',
  styleUrls: ['./waitlist.component.scss'],
})
export class WaitlistComponent implements OnInit {
  myWaitlists: Waitlist[] = [];
  events: Map<string, Event> = new Map();
  loading = true;
  joining = false;

  joinForm: FormGroup;
  showJoinForm = false;
  availableEvents: Event[] = [];
  ticketTypes = Object.values(TicketType);

  constructor(
    private formBuilder: FormBuilder,
    private waitlistService: WaitlistService,
    private eventService: EventService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.joinForm = this.formBuilder.group({
      eventId: ['', Validators.required],
      ticketType: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[+]?[\d\s-()]+$/)]],
    });
  }

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.joinForm.patchValue({
        email: currentUser.email,
        phoneNumber: currentUser.phoneNumber,
      });
    }

    this.loadWaitlists();
    this.loadAvailableEvents();
  }

  loadWaitlists(): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return;

    this.waitlistService.getWaitlistByAttendee(currentUser.id).subscribe({
      next: (waitlists) => {
        this.myWaitlists = waitlists.filter(
          (w) => w.status === 'WAITING' || w.status === 'NOTIFIED'
        );
        this.loadEventsForWaitlists();
      },
      error: (error) => {
        console.error('Error loading waitlists:', error);
        this.loading = false;
      },
    });
  }

  loadEventsForWaitlists(): void {
    const eventIds = [...new Set(this.myWaitlists.map((w) => w.eventId))];

    if (eventIds.length === 0) {
      this.loading = false;
      return;
    }

    let loadedCount = 0;

    eventIds.forEach((eventId) => {
      this.eventService.getEventById(eventId).subscribe({
        next: (event) => {
          this.events.set(eventId, event);
          loadedCount++;
          if (loadedCount === eventIds.length) {
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('Error loading event:', error);
          loadedCount++;
          if (loadedCount === eventIds.length) {
            this.loading = false;
          }
        },
      });
    });
  }

  loadAvailableEvents(): void {
    this.eventService.getPublishedEvents().subscribe({
      next: (events) => {
        this.availableEvents = events.filter((e) => e.date >= new Date());
      },
      error: (error) => {
        console.error('Error loading events:', error);
      },
    });
  }

  get f() {
    return this.joinForm.controls;
  }

  toggleJoinForm(): void {
    this.showJoinForm = !this.showJoinForm;
    if (!this.showJoinForm) {
      this.joinForm.patchValue({
        eventId: '',
        ticketType: '',
        quantity: 1,
      });
    }
  }

  joinWaitlist(): void {
    if (this.joinForm.invalid) {
      Object.keys(this.joinForm.controls).forEach((key) => {
        this.joinForm.get(key)?.markAsTouched();
      });
      return;
    }

    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return;

    this.joining = true;

    const waitlistData = {
      ...this.joinForm.value,
      attendeeId: currentUser.id,
    };

    this.waitlistService.joinWaitlist(waitlistData).subscribe({
      next: (waitlist) => {
        this.snackBar.open('Successfully joined waitlist!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });
        this.toggleJoinForm();
        this.loadWaitlists();
        this.joining = false;
      },
      error: (error) => {
        this.joining = false;
        this.snackBar.open(error.message || 'Failed to join waitlist', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  leaveWaitlist(waitlistId: string): void {
    const confirmLeave = confirm('Are you sure you want to leave this waitlist?');
    if (!confirmLeave) return;

    this.waitlistService.leaveWaitlist(waitlistId).subscribe({
      next: () => {
        this.snackBar.open('Left waitlist successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });
        this.loadWaitlists();
      },
      error: (error) => {
        this.snackBar.open('Failed to leave waitlist', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  getWaitlistPosition(waitlistId: string): void {
    this.waitlistService.getWaitlistPosition(waitlistId).subscribe({
      next: (position) => {
        this.snackBar.open(`Your position in the queue: ${position}`, 'Close', {
          duration: 3000,
        });
      },
    });
  }

  getEvent(eventId: string): Event | undefined {
    return this.events.get(eventId);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatTicketType(type: string): string {
    return type.replace(/_/g, ' ');
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'WAITING':
        return 'accent';
      case 'NOTIFIED':
        return 'primary';
      case 'EXPIRED':
        return 'warn';
      default:
        return '';
    }
  }
}
