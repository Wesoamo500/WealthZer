import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { CurrencyService } from '../core/services/currency.service';

@Component({
  selector: 'app-add-asset-modal',
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="background">
        <ion-buttons slot="start">
          <ion-button (click)="dismiss()">
            <ion-icon name="close-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>Add New Asset</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="form-container">
        <ion-item class="custom-input">
          <ion-label position="stacked">Asset Name</ion-label>
          <ion-input [(ngModel)]="name" placeholder="e.g. Bitcoin, Apple Inc."></ion-input>
        </ion-item>

        <ion-item class="custom-input">
          <ion-label position="stacked">Symbol</ion-label>
          <ion-input [(ngModel)]="symbol" placeholder="e.g. BTC, AAPL"></ion-input>
        </ion-item>

        <ion-row>
          <ion-col size="6">
            <ion-item class="custom-input">
              <ion-label position="stacked">Amount</ion-label>
              <ion-input type="number" [(ngModel)]="amount" placeholder="0.00"></ion-input>
            </ion-item>
          </ion-col>
          <ion-col size="6">
            <ion-item class="custom-input">
              <ion-label position="stacked">Buy Price ({{ currencySymbol }})</ion-label>
              <ion-input type="number" [(ngModel)]="purchasePrice" placeholder="0.00"></ion-input>
            </ion-item>
          </ion-col>
        </ion-row>

        <div class="type-selector">
          <p class="label">Asset Type</p>
          <div class="type-grid">
            <div 
              *ngFor="let type of assetTypes" 
              class="type-item" 
              [class.active]="selectedType === type.id"
              (click)="selectedType = type.id"
            >
              <ion-icon [name]="type.icon"></ion-icon>
              <span>{{ type.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </ion-content>

    <ion-footer class="ion-no-border">
      <div class="footer-padding">
        <ion-button expand="block" class="confirm-btn" (click)="confirm()">
          Add Asset
        </ion-button>
      </div>
    </ion-footer>
  `,
  styles: [`
    ion-content { --background: var(--ion-background-color); }
    .form-container { display: flex; flex-direction: column; gap: 16px; margin-top: 10px; }
    .custom-input {
      --background: #1c1c1e;
      --border-radius: 12px;
      margin-bottom: 8px;
      --padding-start: 16px;
      --inner-padding-end: 16px;
      --highlight-height: 0;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
    }
    .custom-input ion-label { color: var(--ion-color-medium); font-size: 13px; font-weight: 500; }
    .custom-input ion-input { --color: white; font-weight: 600; }
    .type-selector { margin-top: 16px; }
    .type-selector .label { font-size: 12px; color: var(--ion-color-medium); font-weight: 600; margin-bottom: 12px; letter-spacing: 0.5px; }
    .type-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .type-item {
      background: #1c1c1e;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 16px 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
    }
    .type-item ion-icon { font-size: 24px; color: var(--ion-color-medium); }
    .type-item span { font-size: 12px; font-weight: 500; color: var(--ion-color-medium); }
    .type-item.active { border-color: var(--ion-color-primary); background: rgba(var(--ion-color-primary-rgb), 0.1); }
    .type-item.active ion-icon { color: var(--ion-color-primary); }
    .type-item.active span { color: white; font-weight: 600; }
    .footer-padding { padding: 16px; background: var(--ion-background-color); }
    .confirm-btn { --border-radius: 12px; --box-shadow: none; font-weight: 700; height: 50px; --color: black; }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AddAssetModalComponent implements OnInit {
  name: string = '';
  symbol: string = '';
  amount: number | null = null;
  purchasePrice: number | null = null;
  selectedType: string = 'STOCK';
  displayCurrency: string = 'USD';
  currencySymbol: string = '$';

  assetTypes = [
    { id: 'STOCK', label: 'Stock', icon: 'trending-up' },
    { id: 'CRYPTO', label: 'Crypto', icon: 'logo-bitcoin' },
    { id: 'CASH', label: 'Cash', icon: 'wallet' }
  ];

  constructor(
    private modalCtrl: ModalController,
    private currencyService: CurrencyService
  ) {}

  ngOnInit() {
    this.currencyService.currencyCode$.subscribe(code => {
      this.displayCurrency = code;
      this.currencySymbol = this.currencyService.getCurrencyInfo(code).symbol;
    });
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }

  confirm() {
    if (!this.name || !this.symbol || !this.amount || !this.purchasePrice) return;
    
    this.modalCtrl.dismiss({
      name: this.name,
      symbol: this.symbol,
      amount: this.amount,
      type: this.selectedType,
      purchasePrice: this.purchasePrice
    }, 'confirm');
  }
}
