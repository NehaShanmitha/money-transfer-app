import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { RewardService } from '../../services/reward.service';
import { RewardResponse } from '../../models/reward.model';

@Component({
  selector: 'app-rewards',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatChipsModule
  ],
  templateUrl: './rewards.html',
  styleUrls: ['./rewards.css']
})
export class RewardsComponent implements OnInit {
  totalPoints = 0;
  history: RewardResponse[] = [];
  loading = true;
  error = '';
  displayedColumns = ['transactionId', 'pointsEarned', 'createdOn'];

  constructor(
    private rewardService: RewardService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRewards();
  }

  loadRewards(): void {
    this.loading = true;
    this.error = '';

    this.rewardService.getMyPoints().subscribe({
      next: (summary) => {
        this.totalPoints = summary.totalPoints;
        this.loadHistory();
      },
      error: () => {
        this.error = 'Failed to load reward data.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadHistory(): void {
    this.rewardService.getMyHistory().subscribe({
      next: (data) => {
        this.history = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Failed to load reward history.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}