import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router , RouterLink} from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../services/auth.service'; // Check this path
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    CommonModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  username = '';
  password = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private cd: ChangeDetectorRef
  ) {}

  submit(): void {
    if (!this.username.trim() || !this.password.trim()) {
      this.errorMessage = 'Username and password are required';
      return;
    }

    this.errorMessage = ''; 
    
    // Optional: Clear old tokens before trying a fresh login
    localStorage.removeItem('auth_token'); 

    this.authService.login(this.username, this.password).subscribe({
      next: (response) => {
        // Check the role from the updated AuthService/LocalStorage
        const role = this.authService.getUserRole();
        
        if (role === 'ADMIN') {
          this.router.navigate(['/admin-dashboard']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        console.error('Login failed FULL ERROR:', err);

        let message = 'Invalid username or password';

        if (err?.error) {
          if (typeof err.error === 'string') {
            message = err.error;
          } else if (err.error.message) {
            message = err.error.message;
          } else if (err.error.error) {
            message = err.error.error;
          }
        }

        this.errorMessage = message;

        this.authService.logout();

        this.cd.detectChanges(); 
      }
    });
  }
}