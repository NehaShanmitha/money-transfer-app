import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard';
import { AccountDetailsComponent } from './components/account-details/account-details';
import { BalanceViewComponent } from './components/balance-view/balance-view';
import { AuthGuard } from './guards/auth.guard';
import { TransferComponent } from './components/transfer/transfer';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { TransactionHistory } from './components/transaction-history/transaction-history';
import { AdminDashboard } from './components/admin-dashboard/admin-dashboard';
import { RewardsComponent } from './components/rewards/rewards.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'account-details/:id', 
    component: AccountDetailsComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'balance/:id', 
    component: BalanceViewComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'transfer/:id', 
    component: TransferComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'transactions/:id', 
    component: TransactionHistory,
    canActivate: [AuthGuard]
  },
  { 
    path: 'admin-dashboard', 
    component: AdminDashboard, 
    canActivate: [AuthGuard] 
  },
  {
    path: 'rewards',
    component: RewardsComponent,
    canActivate: [AuthGuard]
  },
  { path: '**', redirectTo: '/login' }
];