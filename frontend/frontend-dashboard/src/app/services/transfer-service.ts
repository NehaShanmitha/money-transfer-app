import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

export interface TransferResult {
  id: string;
  fromAccountId: number;
  toAccountId: number;
  amount: number;
  status: string;
  message: string;
  pointsEarned: number;
}

@Injectable({
  providedIn: 'root'
})
export class TransferService {
  private apiUrl = 'http://localhost:8080/api/v1/transfers';

  constructor(private http: HttpClient) {}

  getMyAccounts(): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8080/api/v1/accounts/my-accounts`);
  }

  executeTransfer(fromAccountId: number, toAccountId: number, amount: number): Observable<TransferResult> {
    const payload = { fromAccountId, toAccountId, amount, idempotencyKey: uuidv4() };

    return this.http.post<TransferResult>(this.apiUrl, payload).pipe(
      catchError((error) => {
        console.error('Transfer error:', error);
        return throwError(() => error);
      })
    );
  }
}