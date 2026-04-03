import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { forkJoin, catchError, of, firstValueFrom } from 'rxjs';

// Services
import { AuthService } from '../core/services/auth.service';
import { FinancialService } from '../core/services/financial.service';

// ─── Status messages cycling during load ──────────────────
const LOAD_STATUSES = [
  'Securing connection...',
  'Verifying identity...',
  'Fetching portfolio...',
  'Loading AI insights...',
  'Almost ready...',
];

// ─── Minimum splash display duration (ms) ─────────────────
const MIN_DISPLAY_MS = 2800;

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule],
})
export class SplashPage implements OnInit, OnDestroy {

  // ── Template bindings ──────────────────────────────────
  statusText  = LOAD_STATUSES[0];
  statusVisible = true;

  // ── Internal ───────────────────────────────────────────
  private statusInterval?: ReturnType<typeof setInterval>;
  private statusIndex = 0;

  constructor(
    private router: Router,
    private authService: AuthService,
    private financialService: FinancialService
  ) {}

  // ────────────────────────────────────────────────────────
  async ngOnInit(): Promise<void> {
    await this.configureStatusBar();
    this.startStatusCycle();

    // Run parallel tasks: Auth Check, Data Sync, and Brand Timer
    try {
      const [user, _] = await Promise.all([
        this.checkAuthState(),
        this.minDisplayTimer(),
      ]);

      if (user) {
        this.statusText = 'Finalizing...';
        const hasData = await this.checkUserContent();
        this.navigateNext(true, hasData);
      } else {
        this.navigateNext(false);
      }
    } catch (error) {
      console.error('Splash Synchronization Error:', error);
      this.navigateNext(false);
    }
  }

  ngOnDestroy(): void {
    this.stopStatusCycle();
  }

  // ── Status bar ─────────────────────────────────────────
  private async configureStatusBar(): Promise<void> {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await StatusBar.setOverlaysWebView({ overlay: true });
      await StatusBar.setStyle({ style: Style.Dark });
    } catch (error) {
      console.warn('StatusBar config skipped:', error);
    }
  }

  // ── Status text cycle ──────────────────────────────────
  private startStatusCycle(): void {
    this.statusInterval = setInterval(() => {
      this.statusVisible = false;

      setTimeout(() => {
        this.statusIndex = (this.statusIndex + 1) % LOAD_STATUSES.length;
        this.statusText  = LOAD_STATUSES[this.statusIndex];
        this.statusVisible = true;
      }, 250);
    }, 2000);
  }

  private stopStatusCycle(): void {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
    }
  }

  // ── Auth check ─────────────────────────────────────────
  private async checkAuthState(): Promise<any> {
    // Wait for the AuthService to establish current user state
    return firstValueFrom(this.authService.currentUser);
  }

  // ── Content check ──────────────────────────────────────
  // Determines if user should see the 'Welcome' tour or jump to Home
  private async checkUserContent(): Promise<boolean> {
    try {
      const data = await firstValueFrom(forkJoin({
        transactions: this.financialService.getTransactions().pipe(catchError(() => of([]))),
        portfolio: this.financialService.getPortfolio().pipe(catchError(() => of([])))
      }));
      
      // Returns true if user has existing financial records
      return data.transactions.length > 0 || data.portfolio.length > 0;
    } catch {
      return false;
    }
  }

  // ── Minimum display timer ──────────────────────────────
  private minDisplayTimer(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, MIN_DISPLAY_MS));
  }

  // ── Navigation ─────────────────────────────────────────
  private navigateNext(isAuthenticated: boolean, hasData: boolean = false): void {
    this.stopStatusCycle();

    if (!isAuthenticated) {
      // Not logged in -> To Login Screen
      this.router.navigate(['/auth'], { replaceUrl: true });
    } else if (!hasData) {
      // Logged in but new user -> To Welcome/Onboarding
      this.router.navigate(['/welcome'], { replaceUrl: true });
    } else {
      // Logged in with data -> To Dashboard
      this.router.navigate(['/tabs/home'], { replaceUrl: true });
    }
  }
}