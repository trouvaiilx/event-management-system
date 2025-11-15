// src/app/app-routing.module.ts

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Guards
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

// Components
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

const routes: Routes = [
  // Public Routes
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Password Change (requires auth)
  {
    path: 'change-password',
    component: ChangePasswordComponent,
    canActivate: [AuthGuard],
  },

  // Admin Routes
  {
    path: 'admin',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'ADMIN' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'register-organizer', component: RegisterOrganizerComponent },
      { path: 'manage-organizers', component: ManageOrganizersComponent },
      { path: 'reports', component: AuditoriumReportsComponent },
    ],
  },

  // Organizer Routes
  {
    path: 'organizer',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'EVENT_ORGANIZER' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: OrganizerDashboardComponent },
      { path: 'create-event', component: CreateEventComponent },
      { path: 'manage-events', component: ManageEventsComponent },
      { path: 'event/:id', component: EventDetailsComponent },
      { path: 'event/:id/tickets', component: TicketSetupComponent },
      { path: 'event/:id/promo-codes', component: PromoCodesComponent },
      { path: 'event/:id/analytics', component: EventAnalyticsComponent },
    ],
  },

  // Attendee Routes
  {
    path: 'attendee',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'ATTENDEE' },
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AttendeeDashboardComponent },
      { path: 'browse-events', component: BrowseEventsComponent },
      { path: 'event/:id', component: EventViewComponent },
      { path: 'event/:id/seats', component: SeatSelectionComponent },
      { path: 'checkout', component: BookingCheckoutComponent },
      { path: 'payment/:bookingId', component: PaymentComponent },
      { path: 'my-bookings', component: MyBookingsComponent },
      { path: 'booking/:id', component: BookingDetailsComponent },
      { path: 'waitlist', component: WaitlistComponent },
    ],
  },

  // Catch all
  { path: '**', redirectTo: '/login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
