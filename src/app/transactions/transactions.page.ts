import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FinancialService } from '../core/services/financial.service';

@Component({
  selector: 'app-transactions',
  templateUrl: 'transactions.page.html',
  styleUrls: ['transactions.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class TransactionsPage implements OnInit {

  transactions: any[] = [];

  constructor(private financialService: FinancialService) {}

  ngOnInit() {
    this.loadTransactions();
  }

  loadTransactions() {
    this.financialService.getTransactions().subscribe(res => {
      this.transactions = res.map(t => ({
        title: t.title,
        subtitle: `${t.account} • ${new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        amount: Number(t.amount),
        icon: this.getIconForCategory(t.category),
        iconBg: 'rgba(255, 149, 0, 0.2)',
        iconColor: '#FF9500'
      }));
    });
  }

  private getIconForCategory(cat: string): string {
    const map: any = { 'DINING': 'cafe', 'GROCERIES': 'cart', 'TRANSPORT': 'car', 'FUN': 'game-controller-outline' };
    return map[cat] || 'cash';
  }
}
