// src/app/components/shared/loading-spinner/loading-spinner.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `<div class="loading-container"><mat-spinner></mat-spinner></div>`,
  styles: [
    `
      .loading-container {
        display: flex;
        justify-content: center;
        padding: 2rem;
      }
    `,
  ],
})
export class LoadingSpinnerComponent {}
