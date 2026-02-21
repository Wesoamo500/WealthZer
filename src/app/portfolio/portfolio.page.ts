import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';
import { FinancialService, PortfolioAsset } from '../core/services/financial.service';
import { AddAssetModalComponent } from './add-asset-modal.component';

@Component({
  selector: 'app-portfolio',
  templateUrl: 'portfolio.page.html',
  styleUrls: ['portfolio.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class PortfolioPage implements OnInit {

  assets: PortfolioAsset[] = [];
  totalBalance: number = 0;
  currency: string = 'USD';

  constructor(
    private financialService: FinancialService,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    this.loadPortfolio();
    this.financialService.transactionUpdate$.subscribe(() => {
      this.loadPortfolio();
    });
  }

  loadPortfolio() {
    this.financialService.getPortfolio().subscribe(res => {
      this.assets = res;
    });

    this.financialService.getNetWorth().subscribe(res => {
      this.totalBalance = res.totalNetWorth;
      this.currency = res.currency;
    });
  }

  async openAddAsset() {
    const modal = await this.modalCtrl.create({
      component: AddAssetModalComponent,
      cssClass: 'custom-modal-class'
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data) {
      this.financialService.addAsset(data).subscribe({
        next: () => {
          // Home and Portfolio will auto-refresh due to transactionUpdate$ subscription
        },
        error: (err) => console.error('Error adding asset:', err)
      });
    }
  }

  getIconForAsset(type: string): string {
    const map: any = { 
      'crypto': 'logo-bitcoin', 
      'stock': 'trending-up', 
      'cash': 'wallet-outline' 
    };
    return map[type.toLowerCase()] || 'cube-outline';
  }

  getBgForAsset(type: string): string {
    const map: any = { 
      'crypto': 'rgba(255, 149, 0, 0.2)', 
      'stock': 'rgba(0, 122, 255, 0.2)', 
      'cash': 'rgba(52, 199, 89, 0.2)' 
    };
    return map[type.toLowerCase()] || 'rgba(142, 142, 147, 0.2)';
  }

  getColorForAsset(type: string): string {
    const map: any = { 
      'crypto': '#FF9500', 
      'stock': '#007AFF', 
      'cash': '#34C759' 
    };
    return map[type.toLowerCase()] || '#8E8E93';
  }
}
