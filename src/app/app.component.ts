// src/app/app.component.ts

import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'Event Management System';
  showNavbar = true;

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    // Hide navbar on auth pages
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const authRoutes = ['/login', '/register', '/change-password'];
        this.showNavbar = !authRoutes.some((route) => event.url.includes(route));
      });
  }
}
