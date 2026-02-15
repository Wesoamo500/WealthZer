import { Component } from '@angular/core';
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
  targetAmount: number = 0;
  displayAmount: string = '1,250.00';
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

  selectPeriod(period: 'monthly' | 'weekly') {
    this.selectedPeriod = period;
  }

  selectCategory(categoryId: string) {
    this.selectedCategory = categoryId;
  }
}
