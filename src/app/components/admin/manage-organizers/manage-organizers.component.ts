// src/app/components/admin/manage-organizers/manage-organizers.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/models';

import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatMenuTrigger } from '@angular/material/menu';

@Component({
  selector: 'app-manage-organizers',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatChipsModule,
    MatMenuModule,
    MatSnackBarModule,
  ],
  templateUrl: './manage-organizers.component.html',
  styleUrls: ['./manage-organizers.component.scss'],
})
export class ManageOrganizersComponent implements OnInit {
  organizers: User[] = [];
  loading = true;
  displayedColumns = ['name', 'email', 'organization', 'status', 'actions'];

  constructor(
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadOrganizers();
  }

  loadOrganizers(): void {
    this.userService.getAllEventOrganizers().subscribe({
      next: (organizers) => {
        this.organizers = organizers;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading organizers:', error);
        this.loading = false;
      },
    });
  }

  toggleStatus(organizer: User): void {
    const action = organizer.isActive ? 'deactivate' : 'activate';
    const confirm = window.confirm(`Are you sure you want to ${action} this organizer?`);

    if (!confirm) return;

    const service = organizer.isActive
      ? this.userService.deactivateUser(organizer.id)
      : this.userService.activateUser(organizer.id);

    service.subscribe({
      next: () => {
        this.snackBar.open(`Organizer ${action}d successfully`, 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
        });
        this.loadOrganizers();
      },
      error: (error) => {
        this.snackBar.open(`Failed to ${action} organizer`, 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  registerNew(): void {
    this.router.navigate(['/admin/register-organizer']);
  }
}
