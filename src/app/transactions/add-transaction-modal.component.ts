import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-add-transaction',
  templateUrl: './add-transaction-modal.component.html',
  styleUrls: ['./add-transaction-modal.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AddTransactionModalComponent implements OnInit {
  @ViewChild('amountInput') amountInput!: ElementRef<HTMLInputElement>;
  
  amount: number = 0;
  displayAmount: string = '0.00';
  isAmountFocused: boolean = false;
  selectedCategory = 'dining';
  selectedDate = 'Today';
  selectedAccount = 'Main Bank';
  note = '';

  categories = [
    { id: 'dining', label: 'Dining', icon: 'restaurant' },
    { id: 'groceries', label: 'Groceries', icon: 'cart' },
    { id: 'transport', label: 'Transport', icon: 'car' },
    { id: 'fun', label: 'Fun', icon: 'game-controller' },
    { id: 'others', label: 'Others', icon: 'ellipsis-horizontal' }
  ];

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    this.updateDisplayAmount();
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
    const transaction = {
      amount: this.amount,
      category: this.selectedCategory,
      date: this.selectedDate,
      account: this.selectedAccount,
      note: this.note
    };
    this.modalCtrl.dismiss(transaction, 'confirm');
  }
}
