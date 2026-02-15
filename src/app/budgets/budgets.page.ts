import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-budgets',
  templateUrl: './budgets.page.html',
  styleUrls: ['./budgets.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class BudgetsPage {
  @ViewChild('amountInput') amountInput!: ElementRef<HTMLInputElement>;
  
  targetAmount: number = 0;
  displayAmount: string = '0.00';
  isAmountFocused: boolean = false;
  selectedPeriod: 'monthly' | 'weekly' = 'monthly';
  selectedCategory = 'DINING';

  categories = [
    { id: 'DINING', label: 'Dining', icon: 'restaurant' },
    { id: 'GROCERIES', label: 'Groceries', icon: 'cart' },
    { id: 'TRANSPORT', label: 'Transport', icon: 'car' },
    { id: 'FUN', label: 'Fun', icon: 'game-controller' },
    { id: 'OTHERS', label: 'Others', icon: 'ellipsis-horizontal' }
  ];

  constructor() {}

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
}
