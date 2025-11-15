// Legacy AppModule removed. Project uses standalone bootstrap in `src/main.ts`.
// Keeping this file as a small marker to avoid accidental imports from tooling.

import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { routes } from './app.routes';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatStepperModule } from '@angular/material/stepper';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

// Charts provider (no module declarations here)
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

// Components (non-standalone)
import { LoginComponent } from './components/auth/login/login.component';
import { RegisterComponent } from './components/auth/register/register.component';
import { ChangePasswordComponent } from './components/auth/change-password/change-password.component';

import { AdminDashboardComponent } from './components/admin/admin-dashboard/admin-dashboard.component';
import { RegisterOrganizerComponent } from './components/admin/register-organizer/register-organizer.component';
import { ManageOrganizersComponent } from './components/admin/manage-organizers/manage-organizers.component';
import { AuditoriumReportsComponent } from './components/admin/auditorium-reports/auditorium-reports.component';

import { OrganizerDashboardComponent } from './components/organizer/organizer-dashboard/organizer-dashboard.component';
import { CreateEventComponent } from './components/organizer/create-event/create-event.component';
import { ManageEventsComponent } from './components/organizer/manage-events/manage-events.component';
import { EventDetailsComponent } from './components/organizer/event-details/event-details.component';
import { TicketSetupComponent } from './components/organizer/ticket-setup/ticket-setup.component';
import { SeatingLayoutComponent } from './components/organizer/seating-layout/seating-layout.component';
import { PromoCodesComponent } from './components/organizer/promo-codes/promo-codes.component';
import { EventAnalyticsComponent } from './components/organizer/event-analytics/event-analytics.component';

import { AttendeeDashboardComponent } from './components/attendee/attendee-dashboard/attendee-dashboard.component';
import { BrowseEventsComponent } from './components/attendee/browse-events/browse-events.component';
import { EventViewComponent } from './components/attendee/event-view/event-view.component';
import { SeatSelectionComponent } from './components/attendee/seat-selection/seat-selection.component';
import { BookingCheckoutComponent } from './components/attendee/booking-checkout/booking-checkout.component';
import { PaymentComponent } from './components/attendee/payment/payment.component';
import { MyBookingsComponent } from './components/attendee/my-bookings/my-bookings.component';
import { BookingDetailsComponent } from './components/attendee/booking-details/booking-details.component';
import { WaitlistComponent } from './components/attendee/waitlist/waitlist.component';

import { NavbarComponent } from './components/shared/navbar/navbar.component';
import { SidebarComponent } from './components/shared/sidebar/sidebar.component';
import { FooterComponent } from './components/shared/footer/footer.component';
import { LoadingSpinnerComponent } from './components/shared/loading-spinner/loading-spinner.component';
import { ConfirmDialogComponent } from './components/shared/confirm-dialog/confirm-dialog.component';

@NgModule({
  // This AppModule is intentionally minimal. The project uses standalone
  // components and `bootstrapApplication` in `src/main.ts`. Keep providers
  // here for tooling that may import AppModule.
  providers: [provideCharts(withDefaultRegisterables())],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
