// src/app/components/admin/auditorium-reports/auditorium-reports.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AnalyticsService } from '../../../services/analytics.service';
import { PdfService } from '../../../services/pdf.service';
import { AuditoriumUsageReport, RevenueReport } from '../../../models/models';

import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-auditorium-reports',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NavbarComponent,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatDividerModule,
    MatSnackBarModule,
  ],
  templateUrl: './auditorium-reports.component.html',
  styleUrls: ['./auditorium-reports.component.scss'],
})
export class AuditoriumReportsComponent implements OnInit {
  reportForm: FormGroup;
  loading = false;
  usageReport: AuditoriumUsageReport | null = null;
  revenueReport: RevenueReport | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private analyticsService: AnalyticsService,
    private pdfService: PdfService,
    private snackBar: MatSnackBar
  ) {
    this.reportForm = this.formBuilder.group({
      reportType: ['usage', Validators.required],
      period: ['weekly', Validators.required],
      date: [new Date(), Validators.required],
    });
  }

  ngOnInit(): void {}

  get f() {
    return this.reportForm.controls;
  }

  generateReport(): void {
    if (this.reportForm.invalid) return;

    this.loading = true;
    const { reportType, period, date } = this.reportForm.value;

    if (reportType === 'usage') {
      this.analyticsService.getAuditoriumUsageReport(period, date).subscribe({
        next: (report) => {
          this.usageReport = report;
          this.revenueReport = null;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error generating report:', error);
          this.loading = false;
          this.snackBar.open('Failed to generate report', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar'],
          });
        },
      });
    } else if (reportType === 'revenue') {
      this.analyticsService.getRevenueReport(period, date).subscribe({
        next: (report) => {
          this.revenueReport = report;
          this.usageReport = null;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error generating report:', error);
          this.loading = false;
          this.snackBar.open('Failed to generate report', 'Close', {
            duration: 3000,
            panelClass: ['error-snackbar'],
          });
        },
      });
    }
  }

  downloadUsageReport(): void {
    if (this.usageReport) {
      this.pdfService.generateAuditoriumUsageReport(this.usageReport);
      this.snackBar.open('Report downloaded successfully!', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar'],
      });
    }
  }

  downloadRevenueReport(): void {
    if (this.revenueReport) {
      this.pdfService.generateRevenueReport(this.revenueReport);
      this.snackBar.open('Report downloaded successfully!', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar'],
      });
    }
  }
}
