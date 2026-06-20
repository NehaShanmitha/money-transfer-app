import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { RewardResponse, RewardSummary } from '../models/reward.model';

@Injectable({
  providedIn: 'root'
})
export class RewardService {
  private baseUrl = `${environment.apiBaseUrl}/api/rewards`;

  constructor(private http: HttpClient) {}

  getMyPoints(): Observable<RewardSummary> {
    return this.http.get<RewardSummary>(`${this.baseUrl}/my-points`);
  }

  getMyHistory(): Observable<RewardResponse[]> {
    return this.http.get<RewardResponse[]>(`${this.baseUrl}/my-history`);
  }
}