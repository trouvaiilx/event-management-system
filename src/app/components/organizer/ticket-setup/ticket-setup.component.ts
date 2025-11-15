// src/app/components/organizer/ticket-setup/ticket-setup.component.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { EventService } from '../../../services/event.service';
import { Event, TicketCategory, TicketType, SeatSection } from '../../../models/models';

@Component({
  selector: 'app-ticket-setup',
  templateUrl: './ticket-setup.component.html',
  styleUrls: ['./ticket-setup.component.scss'],
})
export class TicketSetupComponent implements OnInit {
  eventId: string = '';
  event: Event | null = null;
  ticketCategories: TicketCategory[] = [];
  ticketForm: FormGroup;
  loading = true;
  addingTicket = false;
  showForm = false;

  ticketTypes = Object.values(TicketType);
  seatSections = Object.values(SeatSection);

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.ticketForm = this.formBuilder.group({
      type: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      quantity: ['', [Validators.required, Validators.min(1)]],
      section: ['', Validators.required],
      maxPerBooking: [10, [Validators.min(1)]],
      restrictions: [''],
    });
  }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('id') || '';
    this.loadEventAndTickets();
  }

  loadEventAndTickets(): void {
    this.loading = true;

    this.eventService.getEventById(this.eventId).subscribe({
      next: (event) => {
        this.event = event;
      },
      error: (error) => {
        console.error('Error loading event:', error);
        this.snackBar.open('Failed to load event', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
      },
    });

    this.eventService.getTicketCategoriesByEvent(this.eventId).subscribe({
      next: (categories) => {
        this.ticketCategories = categories;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading ticket categories:', error);
        this.loading = false;
      },
    });
  }

  get f() {
    return this.ticketForm.controls;
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.ticketForm.reset({
        maxPerBooking: 10,
      });
    }
  }

  onAddTicket(): void {
    if (this.ticketForm.invalid) {
      Object.keys(this.ticketForm.controls).forEach((key) => {
        this.ticketForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Check if ticket type already exists
    const existingType = this.ticketCategories.find((tc) => tc.type === this.ticketForm.value.type);

    if (existingType) {
      this.snackBar.open('This ticket type already exists', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
      return;
    }

    this.addingTicket = true;

    const ticketData = {
      eventId: this.eventId,
      ...this.ticketForm.value,
    };

    this.eventService.addTicketCategory(ticketData).subscribe({
      next: (category) => {
        this.ticketCategories.push(category);
        this.snackBar.open('Ticket category added successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });
        this.ticketForm.reset({
          maxPerBooking: 10,
        });
        this.showForm = false;
        this.addingTicket = false;
      },
      error: (error) => {
        this.addingTicket = false;
        this.snackBar.open(error.message || 'Failed to add ticket category', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  getTotalSeats(): number {
    return this.ticketCategories.reduce((sum, tc) => sum + tc.quantity, 0);
  }

  getTotalRevenuePotential(): number {
    return this.ticketCategories.reduce((sum, tc) => sum + tc.quantity * tc.price, 0);
  }

  formatTicketType(type: string): string {
    return type.replace(/_/g, ' ');
  }

  formatSection(section: string): string {
    return section.charAt(0).toUpperCase() + section.slice(1).toLowerCase();
  }

  onPublishEvent(): void {
    if (this.ticketCategories.length === 0) {
      this.snackBar.open('Please add at least one ticket category before publishing', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar'],
      });
      return;
    }

    this.eventService.publishEvent(this.eventId).subscribe({
      next: () => {
        this.snackBar.open('Event published successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });
        this.router.navigate(['/organizer/event', this.eventId]);
      },
      error: (error) => {
        this.snackBar.open(error.message || 'Failed to publish event', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  onSaveDraft(): void {
    this.snackBar.open('Event saved as draft', 'Close', {
      duration: 2000,
      panelClass: ['success-snackbar'],
    });
    this.router.navigate(['/organizer/manage-events']);
  }

  onCancel(): void {
    this.router.navigate(['/organizer/dashboard']);
  }
}
