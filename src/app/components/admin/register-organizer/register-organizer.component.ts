// src/app/components/admin/register-organizer/register-organizer.component.ts

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-register-organizer',
  templateUrl: './register-organizer.component.html',
  styleUrls: ['./register-organizer.component.scss'],
})
export class RegisterOrganizerComponent implements OnInit {
  organizerForm: FormGroup;
  loading = false;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.organizerForm = this.formBuilder.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[+]?[\d\s-()]+$/)]],
      organizationName: [''],
    });
  }

  ngOnInit(): void {}

  get f() {
    return this.organizerForm.controls;
  }

  onSubmit(): void {
    if (this.organizerForm.invalid) {
      return;
    }

    this.loading = true;
    const formData = this.organizerForm.value;

    this.userService.registerEventOrganizer(formData).subscribe({
      next: (user) => {
        this.snackBar.open(
          `Event organizer registered successfully! Welcome email sent to ${user.email}`,
          'Close',
          {
            duration: 5000,
            panelClass: ['success-snackbar'],
          }
        );
        this.router.navigate(['/admin/manage-organizers']);
      },
      error: (error) => {
        this.loading = false;
        this.snackBar.open(error.message || 'Failed to register event organizer.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'],
        });
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/admin/dashboard']);
  }

  onReset(): void {
    this.organizerForm.reset();
  }
}
