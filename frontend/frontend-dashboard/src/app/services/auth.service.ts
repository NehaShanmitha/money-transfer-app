import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly TOKEN_KEY = 'auth_token';
  // Points to your Spring Boot Backend
  private baseUrl = environment.apiBaseUrl; 

  constructor(private http: HttpClient, private router: Router) {}

// auth.service.ts

login(username: string, password: string): Observable<any> {
  const loginUrl = `${this.baseUrl}/api/auth/login`;
  
  return this.http.post<any>(loginUrl, { username, password }).pipe(
    tap(response => {
      // 1. Save the Auth Token
      const token = btoa(`${username}:${password}`);
      this.setToken(token);

      // 2. SAVE THE USER DATA (The missing link!)
      // Assuming your backend returns { id: number, username: string, ... }
      if (response) {
        localStorage.setItem('user_data', JSON.stringify(response));
      }
    })
  );
}

// Ensure your logout clears this as well
logout(): void {
  localStorage.removeItem(this.TOKEN_KEY);
  localStorage.removeItem('user_data'); // Clear user info
  this.router.navigate(['/login']); 
}

  // 2. REGISTER
  // Matches @PostMapping("/api/auth/register")
  register(username: string, password: string): Observable<any> {
    const registerUrl = `${this.baseUrl}/api/auth/register`;
    
    return this.http.post<any>(registerUrl, { 
      username, 
      password,
      //role: 'ADMIN' // Optional: depending on your DTO
    });
  }


  // 4. CHECK AUTH STATUS
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  // auth.service.ts

getCurrentUser(): number | null {
  const token = localStorage.getItem(this.TOKEN_KEY);
  if (!token) return null;

  const userData = localStorage.getItem('user_data');
  
  // Debugging: Check what is actually in storage
  console.log('Stored User Data:', userData);

  if (!userData) return null;

  try {
    const user = JSON.parse(userData);
    return user.id || null; 
  } catch (e) {
    console.error('Error parsing user data', e);
    return null;
  }
}

getUserRole(): string | null {
  const userData = localStorage.getItem('user_data');
  if (!userData) return null;
  const user = JSON.parse(userData);
  return user.role; // Will return 'ADMIN' or 'USER'
}

}