// src/app/components/organizer/promo-codes/promo-codes.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { EventService } from '../../../services/event.service';
import { Event, PromotionalCode, TicketType } from '../../../models/models';

import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';

import { NavbarComponent } from '../../shared/navbar/navbar.component';

@Component({
  selector: 'app-promo-codes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatCardModule,
    MatTableModule,
    MatSnackBarModule,
    NavbarComponent,
  ],
  templateUrl: './promo-codes.component.html',
  styleUrls: ['./promo-codes.component.scss'],
})
export class PromoCodesComponent implements OnInit {
  eventId: string = '';
  event: Event | null = null;
  promoCodes: PromotionalCode[] = [];
  promoForm: FormGroup;
  loading = true;
  showForm = false;
  ticketTypes = Object.values(TicketType);

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private snackBar: MatSnackBar
  ) {
    this.promoForm = this.formBuilder.group({
      code: ['', [Validators.required, Validators.minLength(3)]],
      discountPercentage: [0, [Validators.min(0), Validators.max(100)]],
      validFrom: [new Date(), Validators.required],
      validUntil: ['', Validators.required],
      usageLimit: [null],
    });
  }

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('id') || '';
    this.loadEventAndPromos();
  }

  loadEventAndPromos(): void {
    this.eventService.getEventById(this.eventId).subscribe({
      next: (event) => {
        this.event = event;
      },
      error: (error) => console.error('Error loading event:', error),
    });

    this.eventService.getPromotionalCodesByEvent(this.eventId).subscribe({
      next: (promos) => {
        this.promoCodes = promos;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading promo codes:', error);
        this.loading = false;
      },
    });
  }

  get f() {
    return this.promoForm.controls;
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
  }

  onSubmit(): void {
    if (this.promoForm.invalid) return;

    const promoData = {
      eventId: this.eventId,
      ...this.promoForm.value,
    };

    this.eventService.createPromotionalCode(promoData).subscribe({
      next: (promo) => {
        this.promoCodes.push(promo);
        this.snackBar.open('Promo code created successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });
        this.promoForm.reset();
        this.showForm = false;
      },
      error: (error) => {
        this.snackBar.open(error.message || 'Failed to create promo code', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/organizer/event', this.eventId]);
  }
}
