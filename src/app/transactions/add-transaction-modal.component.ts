import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { CurrencyService } from '../core/services/currency.service';

@Component({
  selector: 'app-add-transaction',
  templateUrl: './add-transaction-modal.component.html',
  styleUrls: ['./add-transaction-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AddTransactionModalComponent implements OnInit {
  @ViewChild('amountInput') amountInput!: ElementRef<HTMLInputElement>;
  
  title: string = '';
  amount: number = 0;
  displayAmount: string = '0.00';
  isAmountFocused: boolean = false;
  selectedCategory = 'OTHERS';
  selectedDate = new Date().toISOString();
  selectedAccount = 'BANK';
  note = '';
  exchangeRate: number = 1;

  categories = [
    { id: 'INCOME', label: 'Income', icon: 'trending-up' },
    { id: 'TRANSFER', label: 'Transfer', icon: 'swap-horizontal' },
    { id: 'DINING', label: 'Dining', icon: 'restaurant' },
    { id: 'GROCERIES', label: 'Groceries', icon: 'cart' },
    { id: 'TRANSPORT', label: 'Transport', icon: 'car' },
    { id: 'FUN', label: 'Fun', icon: 'game-controller' },
    { id: 'OTHERS', label: 'Others', icon: 'ellipsis-horizontal' }
  ];

  accounts = [
    { id: 'BANK', label: 'Main Bank', icon: 'business' },
    { id: 'CASH', label: 'Cash Wallet', icon: 'wallet' },
    { id: 'CREDIT', label: 'Credit Card', icon: 'card' }
  ];

  constructor(
    private modalCtrl: ModalController,
    public currencyService: CurrencyService
  ) {}

  ngOnInit() {
    this.updateDisplayAmount();
    this.currencyService.exchangeRate$.subscribe(rate => {
      this.exchangeRate = rate;
    });
  }

  focusAmountInput() {
    setTimeout(() => {
      this.amountInput?.nativeElement.focus();
    }, 100);
  }

  updateDisplayAmount() {
    if (this.amount === 0 || this.amount === null) {
      this.displayAmount = '0.00';
    } else {
      this.displayAmount = this.amount.toFixed(2);
    }
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  selectCategory(categoryId: string) {
    this.selectedCategory = categoryId;
  }

  confirmTransaction() {
    if (!this.title) {
        return;
    }

    // Convert to USD before saving
    const amountInUSD = this.amount / this.exchangeRate;

    const transaction = {
      title: this.title,
      amount: this.selectedCategory === 'INCOME' ? Math.abs(amountInUSD) : -Math.abs(amountInUSD),
      category: this.selectedCategory,
      date: this.selectedDate,
      account: this.selectedAccount,
      note: this.note
    };
    this.modalCtrl.dismiss(transaction, 'confirm');
  }
}
