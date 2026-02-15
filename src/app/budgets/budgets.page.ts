import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { FinancialService, Budget, Transaction } from '../core/services/financial.service';

@Component({
  selector: 'app-budgets',
  templateUrl: './budgets.page.html',
  styleUrls: ['./budgets.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class BudgetsPage implements OnInit {
  @ViewChild('amountInput') amountInput!: ElementRef<HTMLInputElement>;
  
  targetAmount: number = 0;
  displayAmount: string = '0.00';
  isAmountFocused: boolean = false;
  selectedPeriod: 'monthly' | 'weekly' = 'monthly';
  selectedCategory = 'DINING';
  
  budgets: Budget[] = [];
  allTransactions: Transaction[] = [];
  totalMonthlyIncome: number = 4500; // Mock current income

  categories = [
    { id: 'DINING', label: 'Dining', icon: 'restaurant' },
    { id: 'GROCERIES', label: 'Groceries', icon: 'cart' },
    { id: 'TRANSPORT', label: 'Transport', icon: 'car' },
    { id: 'FUN', label: 'Fun', icon: 'game-controller' },
    { id: 'OTHERS', label: 'Others', icon: 'ellipsis-horizontal' }
  ];

  constructor(
    private financialService: FinancialService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.loadData();
    this.financialService.budgetUpdate$.subscribe(() => this.loadData());
    this.financialService.transactionUpdate$.subscribe(() => this.loadData());
  }

  loadData() {
    this.financialService.getBudgets().subscribe(res => {
      this.budgets = res;
    });
    this.financialService.getTransactions().subscribe(res => {
      this.allTransactions = res;
    });
  }

  focusAmountInput() {
    this.amountInput.nativeElement.focus();
    this.isAmountFocused = true;
  }

  onAmountBlur() {
    this.isAmountFocused = false;
    this.updateDisplayAmount();
  }

  updateDisplayAmount() {
    if (this.targetAmount === 0 || this.targetAmount === null) {
      this.displayAmount = '0.00';
    } else {
      this.displayAmount = this.targetAmount.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
  }

  selectPeriod(period: 'monthly' | 'weekly') {
    this.selectedPeriod = period;
  }

  selectCategory(categoryId: string) {
    this.selectedCategory = categoryId;
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

  async createBudget() {
    if (this.targetAmount <= 0) {
      this.showToast('Please enter a valid amount');
      return;
    }

    const existingBudget = this.getBudgetForCategory(this.selectedCategory);
    if (existingBudget) {
      this.showToast(`A budget for ${this.selectedCategory} already exists.`);
      return;
    }

    const newBudget: Budget = {
      category: this.selectedCategory,
      amount: this.targetAmount,
      period: this.selectedPeriod,
      spent: 0
    };

    this.financialService.addBudget(newBudget).subscribe({
      next: () => {
        this.showToast('Budget created successfully!');
        this.targetAmount = 0;
        this.updateDisplayAmount();
      },
      error: () => this.showToast('Error creating budget. Please try again.')
    });
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
