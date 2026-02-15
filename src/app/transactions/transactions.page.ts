import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { FinancialService } from '../core/services/financial.service';
import { AddTransactionModalComponent } from './add-transaction-modal.component';

@Component({
  selector: 'app-transactions',
  templateUrl: 'transactions.page.html',
  styleUrls: ['transactions.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class TransactionsPage implements OnInit {

  allTransactions: any[] = [];
  filteredTransactions: any[] = [];
  selectedFilter: string = 'all';

  constructor(
    private financialService: FinancialService,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    this.loadTransactions();
  }

  loadTransactions() {
    this.financialService.getTransactions().subscribe(res => {
      this.allTransactions = res.map(t => ({
        ...t,
        subtitle: `${t.account} • ${new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        amount: Number(t.amount),
        icon: this.getIconForCategory(t.category),
        iconBg: this.getBgForCategory(t.category),
        iconColor: this.getColorForCategory(t.category)
      }));
      this.applyFilter();
    });
  }

  setFilter(filter: string) {
    this.selectedFilter = filter;
    this.applyFilter();
  }

  applyFilter() {
    if (this.selectedFilter === 'all') {
      this.filteredTransactions = this.allTransactions;
    } else {
      this.filteredTransactions = this.allTransactions.filter(t => 
        t.category.toLowerCase() === this.selectedFilter.toLowerCase() ||
        (this.selectedFilter === 'income' && t.amount > 0) ||
        (this.selectedFilter === 'expenses' && t.amount < 0)
      );
    }
  }

  async openAddTransaction() {
    const modal = await this.modalCtrl.create({
      component: AddTransactionModalComponent,
      breakpoints: [0, 0.7, 0.9],
      initialBreakpoint: 0.7
    });
    
    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'confirm') {
      this.financialService.addTransaction(data).subscribe(() => {
        this.loadTransactions();
      });
    }
  }

  private getIconForCategory(cat: string): string {
    const map: any = { 
      'dining': 'restaurant', 
      'groceries': 'cart', 
      'transport': 'car', 
      'fun': 'game-controller',
      'others': 'ellipsis-horizontal'
    };
    return map[cat.toLowerCase()] || 'cash-outline';
  }

  private getBgForCategory(cat: string): string {
    const map: any = { 
      'dining': 'rgba(255, 149, 0, 0.2)', 
      'groceries': 'rgba(52, 199, 89, 0.2)', 
      'transport': 'rgba(0, 122, 255, 0.2)', 
      'fun': 'rgba(175, 82, 222, 0.2)' 
    };
    return map[cat.toLowerCase()] || 'rgba(142, 142, 147, 0.2)';
  }

  private getColorForCategory(cat: string): string {
    const map: any = { 
      'dining': '#FF9500', 
      'groceries': '#34C759', 
      'transport': '#007AFF', 
      'fun': '#AF52DE' 
    };
    return map[cat.toLowerCase()] || '#8E8E93';
  }
}
