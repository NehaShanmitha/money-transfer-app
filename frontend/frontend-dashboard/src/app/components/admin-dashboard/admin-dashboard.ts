import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { AnalyticsService } from '../../services/analytics.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  providers: [provideCharts(withDefaultRegisterables())],
  imports: [
    CommonModule, MatToolbarModule, MatButtonModule, MatCardModule,
    MatIconModule, MatProgressSpinnerModule, MatTooltipModule,
    DecimalPipe, BaseChartDirective
  ],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  stats: any;
  loading = true;
  error = '';

  // ── EXISTING: Transaction trend line chart ────────────────────────────────
  public lineChartData: ChartData<'line'> = { datasets: [], labels: [] };
  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { display: false } },
      x: { grid: { display: false } }
    }
  };

  // ── NEW: Points by user bar chart ─────────────────────────────────────────
  public rewardBarData: ChartData<'bar'> = { datasets: [], labels: [] };
  public rewardBarOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { display: false },
           ticks: { stepSize: 1 } },
      x: { grid: { display: false } }
    }
  };

  // ── NEW: Reward trend line chart ──────────────────────────────────────────
  public rewardTrendData: ChartData<'line'> = { datasets: [], labels: [] };
  public rewardTrendOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { display: false },
           ticks: { stepSize: 1 } },
      x: { grid: { display: false } }
    }
  };

  constructor(
    private analyticsService: AnalyticsService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.fetchStats(); }

  fetchStats() {
    this.loading = true;
    this.error = '';
    this.analyticsService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.setupCharts(data);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'Snowflake Connection Failed';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  setupCharts(data: any) {
    // ── EXISTING: transaction trend ───────────────────────────────────────
    this.lineChartData = {
      labels: [...(data.trendLabels ?? [])].reverse(),
      datasets: [{
        data: [...(data.trendValues ?? [])].reverse(),
        label: 'Transactions',
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        fill: true,
        tension: 0.4
      }]
    };

    // ── NEW: points by user bar chart ─────────────────────────────────────
    this.rewardBarData = {
      labels: data.rewardUserLabels ?? [],
      datasets: [{
        data: data.rewardUserPoints ?? [],
        label: 'Total Points',
        backgroundColor: [
          'rgba(240, 192, 64, 0.8)',
          'rgba(245, 127, 23, 0.8)',
          'rgba(14, 165, 233, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(139, 92, 246, 0.8)'
        ],
        borderRadius: 6
      }]
    };

    // ── NEW: reward points trend ──────────────────────────────────────────
    this.rewardTrendData = {
      labels: [...(data.rewardTrendLabels ?? [])].reverse(),
      datasets: [{
        data: [...(data.rewardTrendValues ?? [])].reverse(),
        label: 'Points Issued',
        borderColor: '#f0c040',
        backgroundColor: 'rgba(240, 192, 64, 0.12)',
        fill: true,
        tension: 0.4
      }]
    };
  }

  logout() { this.authService.logout(); }
}