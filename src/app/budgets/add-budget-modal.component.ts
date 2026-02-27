import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { CurrencyService } from '../core/services/currency.service';

@Component({
  selector: 'app-add-budget-modal',
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="background">
        <ion-buttons slot="start">
          <ion-button (click)="dismiss()">
            <ion-icon name="close-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Set Budget</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="form-container">
        <div class="amount-input-section">
          <p class="label">MONTHLY LIMIT</p>
          <div class="amount-row">
            <span class="currency">{{ currencySymbol }}</span>
            <ion-input type="number" [(ngModel)]="amount" placeholder="0.00" class="main-amount"></ion-input>
          </div>
        </div>

        <div class="category-selector">
          <p class="label">SELECT CATEGORY</p>
          <div class="category-grid">
            <div 
              *ngFor="let cat of categories" 
              class="category-item" 
              [class.active]="selectedCategory === cat.id"
              (click)="selectedCategory = cat.id"
            >
              <div class="icon-circle">
                <ion-icon [name]="cat.icon"></ion-icon>
              </div>
              <span>{{ cat.label }}</span>
            </div>
          </div>
        </div>

        <div class="period-selector">
          <p class="label">PERIOD</p>
          <div class="toggle-container">
            <div class="toggle-option" [class.active]="period === 'MONTHLY'" (click)="period = 'MONTHLY'">Monthly</div>
            <div class="toggle-option" [class.active]="period === 'WEEKLY'" (click)="period = 'WEEKLY'">Weekly</div>
          </div>
        </div>
      </div>
    </ion-content>

    <ion-footer class="ion-no-border">
      <div class="footer-padding">
        <ion-button expand="block" class="confirm-btn" (click)="confirm()">
          Save Budget
        </ion-button>
      </div>
    </ion-footer>
  `,
  styles: [`
    ion-content { --background: var(--ion-background-color); }
    .form-container { display: flex; flex-direction: column; gap: 32px; margin-top: 10px; }
    .label { font-size: 11px; color: var(--ion-color-medium); font-weight: 700; letter-spacing: 1px; margin-bottom: 12px; }
    
    .amount-input-section { text-align: center; }
    .amount-row { display: flex; align-items: center; justify-content: center; gap: 8px; }
    .currency { font-size: 32px; font-weight: 700; color: white; }
    .main-amount { --padding-start: 0; font-size: 48px; font-weight: 700; color: white; width: 180px; }

    .category-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .category-item {
      background: #1c1c1e;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      padding: 16px 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      transition: all 0.2s ease;
    }
    .icon-circle {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.03);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: var(--ion-color-medium);
    }
    .category-item span { font-size: 12px; font-weight: 500; color: var(--ion-color-medium); }
    .category-item.active { border-color: var(--ion-color-primary); background: rgba(var(--ion-color-primary-rgb), 0.1); }
    .category-item.active .icon-circle { background: var(--ion-color-primary); color: black; }
    .category-item.active span { color: white; font-weight: 600; }

    .toggle-container {
      background: #1c1c1e;
      border-radius: 12px;
      padding: 4px;
      display: flex;
    }
    .toggle-option {
      flex: 1;
      padding: 10px;
      text-align: center;
      border-radius: 9px;
      font-size: 13px;
      font-weight: 600;
      color: var(--ion-color-medium);
      transition: all 0.2s ease;
    }
    .toggle-option.active { background: #2c2c2e; color: white; }

    .footer-padding { padding: 16px; background: var(--ion-background-color); }
    .confirm-btn { --border-radius: 12px; --box-shadow: none; font-weight: 700; height: 52px; --color: black; }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AddBudgetModalComponent implements OnInit {
  amount: number | null = null;
  selectedCategory: string = 'DINING';
  period: string = 'MONTHLY';
  currencySymbol: string = '$';
  exchangeRate: number = 1;

  categories = [
    { id: 'DINING', label: 'Dining', icon: 'restaurant' },
    { id: 'GROCERIES', label: 'Groceries', icon: 'cart' },
    { id: 'TRANSPORT', label: 'Transport', icon: 'car' },
    { id: 'FUN', label: 'Fun', icon: 'game-controller' },
    { id: 'OTHERS', label: 'Others', icon: 'ellipsis-horizontal' }
  ];

  constructor(
    private modalCtrl: ModalController,
    private currencyService: CurrencyService
  ) {}

  ngOnInit() {
    this.currencyService.currencyCode$.subscribe(code => {
      const currencyInfo = this.currencyService.getCurrencyInfo(code);
      this.currencySymbol = currencyInfo.symbol;
    });
    this.currencyService.exchangeRate$.subscribe(rate => {
      this.exchangeRate = rate;
    });
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  confirm() {
    if (!this.amount || this.amount <= 0) return;
    
    // Convert to USD before saving
    const amountInUSD = this.amount / this.exchangeRate;
    
    this.modalCtrl.dismiss({
      category: this.selectedCategory,
      amount: amountInUSD,
      period: this.period
    }, 'confirm');
  }
}
