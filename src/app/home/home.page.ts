import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { FinancialService } from '../core/services/financial.service';
import { AdvisorService } from '../core/services/advisor.service';
import { CurrencyService } from '../core/services/currency.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomePage implements OnInit, OnDestroy {

  netWorth = 0;
  dailyChange = 0;
  dailyChangePercent = 0;
  
  investments = 0;
  budget = 0;
  totalExpenses = 0;
  totalIncome = 0;
  budgetUsedPercentage = 0;

  aiInsight: any = null;
  insightTimestamp: Date | null = null;
  isInsightLoading = true;

  assets: any[] = [];
  recentTransactions: any[] = [];
  financialCards: any[] = [];
  isLoading = true;
  private refreshInterval: any;

  // Health Score
  healthScore: any = null;
  isHealthScoreLoading = true;

  // Currency
  displayCurrency = 'USD';
  exchangeRate = 1;

  constructor(
    private router: Router,
    private financialService: FinancialService,
    private advisorService: AdvisorService,
    public currencyService: CurrencyService
  ) {}

  ngOnInit() {
    this.loadData();

    // Subscribe to reactive updates
    this.financialService.transactionUpdate$.subscribe(() => {
      this.loadData();
    });
    
    this.financialService.budgetUpdate$.subscribe(() => {
      this.loadData();
    });

    // Subscribe to currency changes
    this.currencyService.currencyCode$.subscribe(code => {
      this.displayCurrency = code;
    });
    this.currencyService.exchangeRate$.subscribe(rate => {
      this.exchangeRate = rate;
    });

    // Auto-refresh every 2 hours (7200000 ms)
    this.refreshInterval = setInterval(() => {
        this.loadData();
    }, 7200000);
  }

  ngOnDestroy() {
      if (this.refreshInterval) {
          clearInterval(this.refreshInterval);
      }
  }

  doRefresh(event: any) {
    this.loadData(event);
  }

  loadData(event?: any) {
    if (!event) this.isLoading = true;
    this.financialService.getNetWorth().subscribe(res => {
      this.netWorth = res.totalNetWorth;
      this.dailyChange = res.dailyChange;
      this.dailyChangePercent = Number(res.dailyChangePercent.toFixed(2));
      this.investments = res.totalInvestments;
      this.totalExpenses = Math.abs(res.totalExpenses);
      this.totalIncome = Math.abs(res.totalIncome);
      
      // Calculate total budget (sum of all budget limits)
      this.budget = res.budgets.reduce((sum: number, b: any) => sum + Number(b.amount), 0);
      this.budgetUsedPercentage = this.budget > 0 ? Math.min(Math.round((this.totalExpenses / this.budget) * 100), 100) : 0;
      
      this.updateFinancialCards();
    });

    this.refreshInsight();
    this.loadHealthScore();

    this.financialService.getTransactions().subscribe(res => {
      this.recentTransactions = res.slice(0, 3).map(t => ({
        title: t.title,
        date: new Date(t.date).toLocaleDateString(),
        amount: Number(t.amount),
        icon: this.getIconForCategory(t.category),
        iconBg: this.getBgForCategory(t.category),
        iconColor: this.getColorForCategory(t.category)
      }));
    });

    this.financialService.getPortfolio().subscribe(res => {
      this.assets = res.slice(0, 3).map(a => ({
        name: a.name,
        symbol: a.symbol,
        amount: `${a.amount} ${a.symbol}`,
        value: a.currentValue || a.purchasePrice,
        change: 0, 
        icon: a.type === 'CRYPTO' ? 'logo-bitcoin' : 'briefcase',
        color: a.type === 'CRYPTO' ? '#f7931a' : '#3dc2ff'
      }));
      this.isLoading = false;
      if (event) event.target.complete();
    }, error => {
      this.isLoading = false;
      if (event) event.target.complete();
    });
  }

  refreshInsight() {
    this.isInsightLoading = true;
    this.advisorService.getInsight().subscribe(
      (res) => {
        this.aiInsight = res;
        this.insightTimestamp = new Date();
        this.isInsightLoading = false;
      },
      (err) => {
        this.isInsightLoading = false;
        // Fallback for demo purposes if backend failed
        this.aiInsight = {
          title: "System Offline",
          description: "Could not connect to WealthZer AI to fetch a fresh insight.",
          action: "Retry"
        };
      }
    );
  }

  updateFinancialCards() {
    this.financialCards = [
      {
        title: 'Investments',
        value: this.investments,
        icon: 'trending-up',
        color: 'blue',
        type: 'currency'
      },
      {
        title: 'Total Budget',
        value: this.budget,
        icon: 'pie-chart',
        color: 'orange',
        type: 'currency'
      },
      {
        title: 'Expenses',
        value: this.totalExpenses,
        icon: 'cash-outline',
        color: 'danger',
        type: 'currency'
      },
      {
        title: 'Cash Flow',
        value: this.totalIncome - this.totalExpenses,
        icon: 'swap-vertical',
        color: 'success',
        type: 'currency'
      }
    ];
  }

  getFormattedTimestamp(): string {
    if (!this.insightTimestamp) return 'Just now';
    return this.insightTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  handleAiAction(action: string) {
    if (!action) return;
    const loweredAction = action.toLowerCase();
    
    if (loweredAction.includes('configure') || loweredAction.includes('api')) {
      this.router.navigate(['/tabs/profile']);
    } else if (loweredAction.includes('budget') || loweredAction.includes('limit')) {
      this.router.navigate(['/tabs/budgets']);
    } else if (loweredAction.includes('transaction') || loweredAction.includes('add') || loweredAction.includes('spend')) {
      this.router.navigate(['/tabs/transactions']);
    } else if (loweredAction.includes('asset') || loweredAction.includes('invest') || loweredAction.includes('portfolio')) {
      this.router.navigate(['/tabs/portfolio']);
    } else if (loweredAction.includes('chat') || loweredAction.includes('advisor') || loweredAction.includes('ask')) {
      this.router.navigate(['/tabs/advisor']);
    } else {
      // General fallback to transactions list
      this.router.navigate(['/tabs/transactions']);
    }
  }

  private getIconForCategory(cat: string): string {
    const map: any = { 'DINING': 'cafe', 'GROCERIES': 'cart', 'TRANSPORT': 'car', 'FUN': 'game-controller-outline' };
    return map[cat] || 'cash';
  }

  private getBgForCategory(cat: string): string {
    return 'rgba(255, 149, 0, 0.2)';
  }

  private getColorForCategory(cat: string): string {
    return '#FF9500';
  }

  loadHealthScore() {
    this.isHealthScoreLoading = true;
    this.financialService.getHealthScore().subscribe(
      (res) => {
        this.healthScore = res;
        this.isHealthScoreLoading = false;
      },
      (err) => {
        console.error('Error loading health score:', err);
        this.isHealthScoreLoading = false;
        this.healthScore = { score: 0, grade: 'N/A', pillars: [], tip: 'Unable to calculate your score right now.', comparisonText: '', savingsRate: 0 };
      }
    );
  }

}
