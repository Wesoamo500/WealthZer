import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, ModalController } from '@ionic/angular';
import { FinancialService, Budget, Transaction } from '../core/services/financial.service';
import { AddBudgetModalComponent } from './add-budget-modal.component';
import { CurrencyService } from '../core/services/currency.service';

@Component({
  selector: 'app-budgets',
  templateUrl: './budgets.page.html',
  styleUrls: ['./budgets.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class BudgetsPage implements OnInit {
  budgets: Budget[] = [];
  allTransactions: Transaction[] = [];
  totalMonthlyIncome: number = 0;
  totalBudgetLimit: number = 0;
  totalSpent: number = 0;
  isLoading: boolean = true;
  displayCurrency: string = 'USD';
  exchangeRate: number = 1;

  categories = [
    { id: 'DINING', label: 'Dining', icon: 'restaurant' },
    { id: 'GROCERIES', label: 'Groceries', icon: 'cart' },
    { id: 'TRANSPORT', label: 'Transport', icon: 'car' },
    { id: 'FUN', label: 'Fun', icon: 'game-controller' },
    { id: 'OTHERS', label: 'Others', icon: 'ellipsis-horizontal' }
  ];

  constructor(
    private financialService: FinancialService,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController,
    public currencyService: CurrencyService
  ) {}

  ngOnInit() {
    this.loadData();
    this.financialService.budgetUpdate$.subscribe(() => this.loadData());
    this.financialService.transactionUpdate$.subscribe(() => this.loadData());

    this.currencyService.currencyCode$.subscribe(code => {
      this.displayCurrency = code;
    });
    this.currencyService.exchangeRate$.subscribe(rate => {
      this.exchangeRate = rate;
    });
  }

  loadData() {
    this.isLoading = true;
    this.financialService.getBudgets().subscribe(res => {
      this.budgets = res;
      this.calculateTotals();
    });
    this.financialService.getTransactions().subscribe(res => {
      this.allTransactions = res;
      this.calculateTotals();
    });
    this.financialService.getNetWorth().subscribe(res => {
      this.totalMonthlyIncome = res.totalIncome;
      this.isLoading = false;
    }, () => this.isLoading = false);
  }

  calculateTotals() {
    this.totalBudgetLimit = this.budgets.reduce((sum, b) => sum + Number(b.amount), 0);
    this.totalSpent = this.budgets.reduce((sum, b) => sum + this.calculateSpentForCategory(b.category), 0);
  }

  async openAddBudget() {
    const modal = await this.modalCtrl.create({
      component: AddBudgetModalComponent,
      cssClass: 'custom-modal-class'
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data) {
      this.financialService.addBudget(data).subscribe({
        next: () => {
          this.showToast('Budget updated successfully!');
          // Subscription will refresh data
        },
        error: () => this.showToast('Error saving budget.')
      });
    }
  }

  getCategoryIcon(categoryId: string): string {
    return this.categories.find(c => c.id === categoryId)?.icon || 'help-outline';
  }

  getBudgetForCategory(categoryId: string): Budget | undefined {
    return this.budgets.find(b => b.category === categoryId);
  }

  calculateSpentForCategory(categoryId: string): number {
    return this.allTransactions
      .filter(t => t.category === categoryId && t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }

  getImpactPercentage(categoryId: string): number {
    const budget = this.getBudgetForCategory(categoryId);
    if (!budget || budget.amount === 0) return 0;
    const spent = this.calculateSpentForCategory(categoryId);
    return Math.min(Math.round((spent / budget.amount) * 100), 100);
  }

  getRemainingAmount(categoryId: string): number {
    const budget = this.getBudgetForCategory(categoryId);
    if (!budget) return 0;
    const spent = this.calculateSpentForCategory(categoryId);
    return Math.max(budget.amount - spent, 0);
  }

  async deleteBudget(id: string) {
    // Optional: Add delete functionality if service supports it
  }

  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'top'
    });
    await toast.present();
  }
}
