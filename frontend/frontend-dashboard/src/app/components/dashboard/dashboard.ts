import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs'; // Added
import { AuthService } from '../../services/auth.service';
import { AccountService } from '../../services/account.service';
import { AccountResponse } from '../../models/account.model';
import { RewardService } from '../../services/reward.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatTabsModule // Added
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  accounts: AccountResponse[] = []; 
  selectedAccount: AccountResponse | null = null; // Renamed for clarity
  loading = true;
  error = '';
  totalPoints = 0;

  constructor(
    private authService: AuthService,
    private accountService: AccountService,
    private rewardService: RewardService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUserData();
  }

  // Filtered list for the UI tabs 
  get visibleAccounts(): AccountResponse[] {
    return this.accounts.filter(acc => acc.status !== 'CLOSED');
  }

  loadUserData(): void {
    this.loading = true;
    this.accountService.getMyAccounts().subscribe({
      next: (data) => {
        this.accounts = data;
        if (this.visibleAccounts.length > 0) {
          this.selectedAccount = this.visibleAccounts[0];
        }
        // Load reward points alongside account data
        this.rewardService.getMyPoints().subscribe({
          next: (summary) => {
            this.totalPoints = summary.totalPoints;
            this.cdr.detectChanges();
          },
          error: () => {
            // Non-critical — don't block dashboard if rewards fail
            this.totalPoints = 0;
          }
        });
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Dashboard error:', err);
        this.error = 'Could not retrieve your accounts. Please try again.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // New method to handle tab selection
  onTabChange(index: number): void {
    this.selectedAccount = this.visibleAccounts[index];
  }
  
  viewAccountDetails(id: number): void { 
    this.router.navigate(['/account-details', id]); 
  }

  viewBalance(id: number): void {
    this.router.navigate(['/balance', id]);
  }

  viewRewards(): void {
    this.router.navigate(['/rewards']);
  }

  doTransfer(id: number): void {
    this.router.navigate(['/transfer', id]);
  }

  viewTransactions(id: number): void {
    this.router.navigate(['/transactions', id]);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  refreshData(): void {
    this.loadUserData();
  }
}