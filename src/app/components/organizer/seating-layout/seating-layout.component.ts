// src/app/components/organizer/seating-layout/seating-layout.component.ts
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Seat, SeatSection } from '../../../models/models';

@Component({
  selector: 'app-seating-layout',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seating-layout.component.html',
  styleUrls: ['./seating-layout.component.scss'],
})
export class SeatingLayoutComponent {
  @Input() seats: Seat[] = [];
  @Input() interactive: boolean = false;

  // Typed sections list to satisfy strictTemplates and avoid passing plain strings
  readonly sections: SeatSection[] = [
    SeatSection.FRONT,
    SeatSection.MIDDLE,
    SeatSection.BACK,
  ];

  getSeatsBySection(section: SeatSection): Seat[] {
    return this.seats.filter((s) => s.section === section);
  }
}
