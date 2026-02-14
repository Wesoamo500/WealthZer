import { Component, OnInit } from '@angular/core';
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
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class HomePage implements OnInit {

  netWorth = 124592.40;
  dailyChange = 2410.50;
  dailyChangePercent = 1.97;
  
  investments = 84210;
  budget = 1200;

  aiInsight = {
    title: 'Subscription Optimization',
    description: 'I noticed 3 recurring streaming services you haven\'t used in 30 days. Canceling these could save you $42.99/month.',
    action: 'Analyze Subscriptions'
  };

  assets: any[] = [];
  recentTransactions: any[] = [];

  constructor(private financialService: FinancialService) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.financialService.getNetWorth().subscribe(res => {
      this.netWorth = res.totalNetWorth;
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
      this.assets = res.map(a => ({
        name: a.name,
        symbol: a.symbol,
        amount: `${a.amount} ${a.symbol}`,
        value: a.currentValue || a.purchasePrice,
        change: 0, // In real app, calculate from history
        icon: a.type === 'CRYPTO' ? 'logo-bitcoin' : 'briefcase',
        color: '#f7931a'
      }));
    });
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
