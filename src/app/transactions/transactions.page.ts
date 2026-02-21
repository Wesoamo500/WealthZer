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
  isLoading: boolean = true;

  constructor(
    private financialService: FinancialService,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    this.loadTransactions();
    this.financialService.transactionUpdate$.subscribe(() => {
      this.loadTransactions();
    });
  }

  loadTransactions() {
    this.isLoading = true;
    this.financialService.getTransactions().subscribe({
      next: (res) => {
        this.allTransactions = res.map(t => ({
          ...t,
          subtitle: `${t.account} • ${new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          amount: Number(t.amount),
          icon: this.getIconForCategory(t.category),
          iconBg: this.getBgForCategory(t.category),
          iconColor: this.getColorForCategory(t.category)
        }));
        this.applyFilter();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading transactions:', err);
        this.isLoading = false;
      }
    });
  }

  setFilter(filter: string) {
    this.selectedFilter = filter;
    this.applyFilter();
  }

  applyFilter() {
    if (this.selectedFilter === 'all') {
      this.filteredTransactions = this.allTransactions;
    } else if (this.selectedFilter === 'income') {
      this.filteredTransactions = this.allTransactions.filter(t => t.amount > 0);
    } else if (this.selectedFilter === 'expenses') {
      this.filteredTransactions = this.allTransactions.filter(t => t.amount < 0);
    } else if (this.selectedFilter === 'transfers') {
      this.filteredTransactions = this.allTransactions.filter(t => 
        t.category.toLowerCase() === 'transfer' || t.category.toLowerCase() === 'transfers'
      );
    } else {
      this.filteredTransactions = this.allTransactions.filter(t => 
        t.category.toLowerCase() === this.selectedFilter.toLowerCase()
      );
    }
  }

  async openAddTransaction() {
    const modal = await this.modalCtrl.create({
      component: AddTransactionModalComponent,
      breakpoints: [0, 0.9, 1.0],
      initialBreakpoint: 0.9
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
