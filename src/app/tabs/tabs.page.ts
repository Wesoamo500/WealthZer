import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, ModalController } from '@ionic/angular';
import { AddTransactionModalComponent } from '../transactions/add-transaction-modal.component';
import { FinancialService } from '../core/services/financial.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [IonicModule],
})
export class TabsPage {

  constructor(
    private modalCtrl: ModalController,
    private financialService: FinancialService,
    private router: Router
  ) {}

  async openAddTransaction() {
    const modal = await this.modalCtrl.create({
      component: AddTransactionModalComponent,
      breakpoints: [0, 0.9, 1.0],
      initialBreakpoint: 0.9,
      cssClass: 'add-transaction-modal'
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'confirm') {
      this.financialService.addTransaction(data).subscribe(() => {
        console.log('Transaction added and notified');
      });
    }
  }

  navigateToAdvisor() {
    this.router.navigate(['/tabs/advisor']);
  }

}
