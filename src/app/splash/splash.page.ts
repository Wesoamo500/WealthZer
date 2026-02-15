import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { FinancialService } from '../core/services/financial.service';
import { forkJoin, catchError, of, firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class SplashPage implements OnInit {
  progress = 0;
  statusText = 'INITIALIZING SYSTEM';

  constructor(
    private router: Router,
    private authService: AuthService,
    private financialService: FinancialService
  ) {}

  ngOnInit() {
    this.startSynchronization();
  }

  private async startSynchronization() {
    try {
      // Stage 1: Auth Verification (0-30%)
      this.statusText = 'VERIFYING SESSION';
      this.updateProgress(10);
      
      // Wait for AuthService to emit the first value from checkSession
      const user = await firstValueFrom(this.authService.currentUser);
      this.updateProgress(30);

      if (user) {
        // Stage 2: Data Fetching (30-90%)
        this.statusText = 'SYNCHRONIZING DATA';
        
        await this.fetchRealData();
        this.updateProgress(90);
      } else {
        // Give time for UI to breathe even if no auth
        await this.delay(800);
        this.updateProgress(90);
      }

      // Stage 3: Finalizing (90-100%)
      this.statusText = 'READY';
      this.updateProgress(100);
      await this.delay(500);

      if (user) {
        this.router.navigate(['/tabs/home'], { replaceUrl: true });
      } else {
        this.router.navigate(['/auth/login'], { replaceUrl: true });
      }
    } catch (error) {
      console.error('Synchronization failed:', error);
      this.statusText = 'OFFLINE MODE';
      // Navigate anyway to allow user to try login or use cached data
      this.router.navigate(['/auth/login'], { replaceUrl: true });
    }
  }

  private async fetchRealData() {
    // Fetch all required data in parallel
    const sync$ = forkJoin({
      transactions: this.financialService.getTransactions().pipe(catchError(() => of([]))),
      portfolio: this.financialService.getPortfolio().pipe(catchError(() => of([]))),
      netWorth: this.financialService.getNetWorth().pipe(catchError(() => of({ totalNetWorth: 0, currency: 'USD' })))
    });

    // We use a small interval to smooth the progress bar while waiting for response
    const interval = setInterval(() => {
        if (this.progress < 85) this.progress += 2;
    }, 100);

    try {
        await firstValueFrom(sync$);
    } finally {
        clearInterval(interval);
    }
  }

  private updateProgress(val: number) {
    this.progress = val;
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
