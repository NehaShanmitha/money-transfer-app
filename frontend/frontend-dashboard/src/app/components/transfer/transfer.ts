import { Component, OnInit, ChangeDetectorRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormGroupDirective } from '@angular/forms';
import { TransferService } from '../../services/transfer-service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar } from '@angular/material/snack-bar'; // Import SnackBar
import { finalize } from 'rxjs'; // 1. Add this import
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Location } from '@angular/common'; // Import for back button
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../../services/auth.service';
import { TransferResult } from '../../services/transfer-service';

@Component({
  selector: 'app-transfer',
  standalone: true,
  imports: [CommonModule, 
    ReactiveFormsModule, 
    MatCardModule, 
    MatFormFieldModule, 
    MatToolbarModule, 
    MatInputModule, 
    MatSelectModule, 
    MatButtonModule, 
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './transfer.html',
  styleUrls: ['./transfer.css']
})

export class TransferComponent implements OnInit {
  @ViewChild(FormGroupDirective) formGroupDirective!: FormGroupDirective;

  transferForm: FormGroup;
  accounts: any[] = [];
  loading = false;
  toAccountValid = false;
  transferResult: any = null;   // holds the response after success
  resultVisible = false;        // controls showing the result panel

  constructor(
    private fb: FormBuilder, 
    private transferService: TransferService, 
    private cdr: ChangeDetectorRef,
    private authService: AuthService, // Inject your Auth Service
    private location: Location,
    private snackBar: MatSnackBar // Inject SnackBar
  ) {
    this.transferForm = this.fb.group({
      fromAccountId: ['', Validators.required], 
      toAccountId: [{ value: '', disabled: true }, [Validators.required, Validators.pattern('^[0-9]*$')]],
      amount: [{ value: '', disabled: true }, [Validators.required, Validators.min(0.01)]]
    });
  }

// transfer.ts

ngOnInit() {
  this.loadUserAccounts(); // No ID needed here anymore
}

get visibleAccounts() {
    return this.accounts.filter(acc => acc.status !== 'CLOSED');
  }

loadUserAccounts() {
  this.loading = true;
  this.transferService.getMyAccounts().subscribe({
    next: (data) => {
      // Your API returns a List<AccountResponse>, so 'data' is the array
      this.accounts = data; 
      this.loading = false;
      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Error fetching accounts:', err);
      this.loading = false;
      this.showSnackbar('Could not load your accounts.', 'error');
    }
  });
}

  goBack() {
    this.location.back();
  }


  // FIX 1: Explicitly patch the value so the readonly input sees it
  onAccountSelect(accountId: any) {
    const id = Number(accountId);
    this.transferForm.patchValue({ fromAccountId: id }); // This ensures the readonly input updates
    
    this.transferForm.get('toAccountId')?.enable();
    this.transferForm.get('toAccountId')?.setValue('');
    this.transferForm.get('amount')?.disable();
    this.transferForm.get('amount')?.setValue('');
    
    this.toAccountValid = false;
    this.cdr.detectChanges();
  }

  validateToAccount() {
    const toControl = this.transferForm.get('toAccountId');
    const fromId = this.transferForm.get('fromAccountId')?.value;
    const toId = toControl?.value;

    this.toAccountValid = false;
    this.transferForm.get('amount')?.disable();

    if (!toId) return;

    if (toControl?.errors?.['pattern']) return;

    if (Number(toId) === Number(fromId)) {
      toControl?.setErrors({ sameAccount: true });
    } else {
      this.toAccountValid = true;
      this.transferForm.get('amount')?.enable();
    }
  }

onTransfer() {
  if (this.transferForm.invalid) return;

  this.loading = true;
  this.transferResult = null;
  this.resultVisible = false;

  const { fromAccountId, toAccountId, amount } = this.transferForm.getRawValue();

  this.transferService.executeTransfer(fromAccountId, toAccountId, amount)
    .pipe(
      finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      })
    )
    .subscribe({
      next: (res: TransferResult) => {
        this.transferResult = {
          ...res,
          resultType: 'success',
          pointsEarned: res.pointsEarned ?? 0   // no coercion needed — properly typed now
        };
        this.resultVisible = true;
        this.clearForm();
        this.loadUserAccounts();
        this.cdr.detectChanges();
      },
      error: (err) => {
        const errorMsg =
          (err.status === 404 || err.error?.message?.includes('not found'))
            ? 'Recipient account ID not found.'
            : err.error?.message || err.error || 'Transfer failed.';

        this.transferResult = {
          resultType: 'failure',
          fromAccountId,
          toAccountId,
          amount,
          reason: errorMsg,
          status: 'FAILED'
        };
        this.resultVisible = true;
        this.cdr.detectChanges();
      }
    });
}

  showSnackbar(message: string, type: 'success' | 'error') {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: type === 'success' ? ['green-snackbar'] : ['red-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  dismissResult(): void {
    this.resultVisible = false;
    this.transferResult = null;
  }

  clearForm() {
    // 1. Reset UI validation states (removes red borders)
    if (this.formGroupDirective) {
      this.formGroupDirective.resetForm();
    }

    // 2. Reset data values
    this.transferForm.reset();

    // 3. Re-enforce the disabled hierarchy
    // Only fromAccountId select should be enabled initially
    this.transferForm.get('toAccountId')?.disable();
    this.transferForm.get('amount')?.disable();
    
    this.toAccountValid = false;
    this.cdr.detectChanges();
  }
}