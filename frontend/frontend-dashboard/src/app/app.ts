/*
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router'; // Import NavigationEnd
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,CommonModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'Money Transfer App';
  showNavbar = true;

  constructor(private router: Router) {
    // Listen to route changes to decide whether to show the navbar
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const excludedRoutes = ['/login', '/register'];
      
      // If the current URL is in the excluded list, hide navbar
      // usage of 'includes' handles cases like '/login?returnUrl=...'
      const isExcluded = excludedRoutes.some(route => event.url.includes(route));
      
      this.showNavbar = !isExcluded;
    });
  }
}
  */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet], // Cleaned up duplicate RouterOutlet here
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'Money Transfer App';
  showNavbar = true;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const excludedRoutes = ['/login', '/register'];
      const isExcluded = excludedRoutes.some(route => event.url.includes(route));
      this.showNavbar = !isExcluded;
    });
  }
}