// ============================================================
// dashboard.page.ts — WealthZer · Page 3: Smart Dashboard
// Sections: Net Worth Hero · Health Score · Stat Swiper ·
//           AI Insight · Budget Snapshot · Top Assets ·
//           Recent Transactions · Bottom Nav
// ============================================================
import {
  Component, OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { Router }        from '@angular/router';
import { RouterModule }  from '@angular/router';
import {
  IonContent, IonRefresher, IonRefresherContent,
  IonSkeletonText, IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  notificationsOutline, trendingUpOutline, walletOutline,
  addOutline, personOutline, barChartOutline,
  arrowUpOutline, arrowDownOutline, sparklesOutline,
} from 'ionicons/icons';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap, startWith } from 'rxjs/operators';

import { FinancialService } from '../core/services/financial.service';
import { AuthService }      from '../core/services/auth.service';
import { firstValueFrom }   from 'rxjs';

// ── Local interfaces ──────────────────────────────────────
export interface NetWorthData {
  total       : number;
  changeAmount: number;
  changePct   : number;
  income      : number;
  expenses    : number;
  saved       : number;
  savingsRate : number;
  updatedAt   : Date;
}

export interface HealthScore {
  score     : number;          // 0–100
  label     : string;          // 'Poor' | 'Fair' | 'Good' | 'Excellent'
  delta     : number;          // pts change this month
  tipsCount : number;
}

export interface StatCard {
  label   : string;
  value   : number;
  change  : number;           // percentage
  icon    : string;           // ion-icon name
  variant : 'teal' | 'copper' | 'neutral';
}

export interface BudgetCategory {
  name    : string;
  emoji   : string;
  spent   : number;
  limit   : number;
  status  : 'ok' | 'warning' | 'over';
}

export interface AssetSummary {
  symbol   : string;
  name     : string;
  type     : string;
  value    : number;
  changePct: number;
}

export interface Transaction {
  id      : string;
  name    : string;
  category: string;
  amount  : number;           // negative = expense, positive = income
  date    : Date;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule, RouterModule, CurrencyPipe, DecimalPipe,
    IonContent, IonRefresher, IonRefresherContent,
    IonSkeletonText, IonIcon,
  ],
})
export class DashboardPage implements OnInit, OnDestroy {

  // ── Loading ─────────────────────────────────────────────
  isLoading = true;

  // ── Data ────────────────────────────────────────────────
  userName    = 'User';
  netWorth!   : NetWorthData;
  healthScore!: HealthScore;
  statCards   : StatCard[]        = [];
  budgets     : BudgetCategory[]  = [];
  budgetsOnTrack = 0;
  topAssets   : AssetSummary[]    = [];
  recentTxns  : Transaction[]     = [];
  aiInsight   = '';
  unreadNotifs = 3;

  // ── Gauge animation ──────────────────────────────────────
  // Used by template to drive SVG stroke-dashoffset
  gaugeOffset = 175.9; // full-circle (hidden) → animates to score

  private destroy$ = new Subject<void>();

  constructor(
    private router    : Router,
    private cdr       : ChangeDetectorRef,
    private auth      : AuthService,
    private financial : FinancialService,
  ) {
    addIcons({
      notificationsOutline, trendingUpOutline, walletOutline,
      addOutline, personOutline, barChartOutline,
      arrowUpOutline, arrowDownOutline, sparklesOutline,
    });
  }

  // ────────────────────────────────────────────────────────
  async ngOnInit(): Promise<void> {
    await this.loadDashboard();
    this.startPolling();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Initial load ─────────────────────────────────────────
  async loadDashboard(): Promise<void> {
    this.isLoading = true;
    try {
      // 1. Get User Context
      const user = await firstValueFrom(this.auth.currentUser);
      this.userName = user?.fullName?.split(' ')[0] || 'User';

      // 2. Fetch all dashboard data in parallel
      const [nw, health, budgets, portfolio, txns] = await Promise.all([
        firstValueFrom(this.financial.getNetWorth()),
        firstValueFrom(this.financial.getHealthScore()),
        firstValueFrom(this.financial.getBudgets()),
        firstValueFrom(this.financial.getPortfolio()),
        firstValueFrom(this.financial.getTransactions()),
      ]);

      // 3. Map Net Worth
      this.netWorth = {
        total: nw.totalNetWorth,
        changeAmount: nw.dailyChange,
        changePct: nw.dailyChangePercent,
        income: nw.totalIncome,
        expenses: nw.totalExpenses,
        saved: nw.totalIncome - nw.totalExpenses,
        savingsRate: health.savingsRate,
        updatedAt: nw.updatedAt ? new Date(nw.updatedAt) : new Date(),
      };

      // 4. Map Health Score
      this.healthScore = {
        score: health.score,
        label: health.grade,
        delta: health.scoreDelta || 0,
        tipsCount: health.tipsCount || 1,
      };

      // 5. Map Stats
      this.statCards = [
        { label: 'Investments', value: nw.totalInvestments, change: nw.totalGainLossPercent, icon: 'trending-up-outline', variant: 'teal' },
        { label: 'Expenses', value: nw.totalExpenses, change: 0, icon: 'wallet-outline', variant: 'copper' },
        { label: 'Daily P&L', value: nw.dailyChange, change: nw.dailyChangePercent, icon: 'bar-chart-outline', variant: 'neutral' },
        { label: 'Cash', value: nw.totalNetWorth - nw.totalInvestments, change: 0, icon: 'wallet-outline', variant: 'neutral' },
      ];

      // 6. Map Budgets
      this.budgets = budgets.map(b => ({
        name: b.category,
        emoji: (b as any).emoji || '📦',
        spent: b.spent,
        limit: b.amount,
        status: b.spent > b.amount ? 'over' : (b.spent > b.amount * 0.8 ? 'warning' : 'ok')
      }));
      this.budgetsOnTrack = this.budgets.filter(b => b.status === 'ok').length;

      // 7. Map Top Assets
      this.topAssets = portfolio.slice(0, 3).map(a => ({
        symbol: a.symbol,
        name: a.name,
        type: a.type,
        value: a.currentValue || 0,
        changePct: a.gainLossPercent || 0
      }));

      // 8. Map Recent Transactions
      this.recentTxns = txns.slice(0, 3).map(t => ({
        id: t.id,
        name: t.title,
        category: t.category,
        amount: t.amount,
        date: new Date(t.date)
      }));

      this.aiInsight = health.tip;
      this.animateGauge();
    } catch (err) {
      console.error('Dashboard load failed:', err);
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  // ── Pull-to-refresh ──────────────────────────────────────
  async onRefresh(event: CustomEvent): Promise<void> {
    await this.loadDashboard();
    (event.detail as any).complete();
  }

  // ── Poll for live price updates (every 30s) ───────────────
  private startPolling(): void {
    interval(30_000)
      .pipe(
        startWith(0),
        switchMap(() => this.fetchLivePrices()),
        takeUntil(this.destroy$),
      )
      .subscribe(updated => {
        if (updated) this.cdr.markForCheck();
      });
  }

  private async fetchLivePrices(): Promise<boolean> {
    try {
      // Selective refresh: only Net Worth and Portfolio
      const [nw, portfolio] = await Promise.all([
        firstValueFrom(this.financial.getNetWorth()),
        firstValueFrom(this.financial.getPortfolio()),
      ]);

      // Update Net Worth
      this.netWorth = { 
        ...this.netWorth, 
        total: nw.totalNetWorth, 
        changeAmount: nw.dailyChange, 
        changePct: nw.dailyChangePercent 
      };

      // Update Top Assets
      this.topAssets = portfolio.slice(0, 3).map(a => ({
        symbol: a.symbol,
        name: a.name,
        type: a.type,
        value: a.currentValue || 0,
        changePct: a.gainLossPercent || 0
      }));

      return true;
    } catch {
      return false;
    }
  }

  // ── Gauge animation ──────────────────────────────────────
  private animateGauge(): void {
    const circumference = 175.9;
    const score = this.healthScore.score;
    setTimeout(() => {
      this.gaugeOffset = circumference * (1 - score / 100);
      this.cdr.markForCheck();
    }, 400);
  }

  // ── Template helpers ──────────────────────────────────────
  get budgetTotalSpent(): number {
    return this.budgets.reduce((s, b) => s + b.spent, 0);
  }

  get budgetTotalLimit(): number {
    return this.budgets.reduce((s, b) => s + b.limit, 0);
  }

  budgetFillPct(cat: BudgetCategory): number {
    return Math.min((cat.spent / cat.limit) * 100, 100);
  }

  isPositive(val: number): boolean { return val >= 0; }

  navigateTo(path: string): void { this.router.navigate([path]); }

  private simulateAsync(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}
