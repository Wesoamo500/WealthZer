import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { FinancialService } from '../core/services/financial.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomePage implements OnInit {

  netWorth = 0;
  dailyChange = 0;
  dailyChangePercent = 0;
  
  investments = 0;
  budget = 0;
  totalExpenses = 0;
  totalIncome = 0;

  aiInsight = {
    title: 'Subscription Optimization',
    description: 'I noticed 3 recurring streaming services you haven\'t used in 30 days. Canceling these could save you $42.99/month.',
    action: 'Analyze Subscriptions'
  };

  assets: any[] = [];
  recentTransactions: any[] = [];
  financialCards: any[] = [];
  isLoading = true;

  constructor(private financialService: FinancialService) {}

  ngOnInit() {
    this.loadData();

    // Subscribe to reactive updates
    this.financialService.transactionUpdate$.subscribe(() => {
      this.loadData();
    });
    
    this.financialService.budgetUpdate$.subscribe(() => {
      this.loadData();
    });
  }

  loadData() {
    this.isLoading = true;
    this.financialService.getNetWorth().subscribe(res => {
      this.netWorth = res.totalNetWorth;
      this.dailyChange = res.dailyChange;
      this.dailyChangePercent = Number(res.dailyChangePercent.toFixed(2));
      this.investments = res.totalInvestments;
      this.totalExpenses = res.totalExpenses;
      this.totalIncome = res.totalIncome;
      
      // Calculate total budget (sum of all budget limits)
      this.budget = res.budgets.reduce((sum: number, b: any) => sum + Number(b.amount), 0);
      
      this.updateFinancialCards();
    });

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
    }, error => {
      this.isLoading = false;
    });
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
}
