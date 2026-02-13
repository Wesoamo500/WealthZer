import { Component } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { AddTransactionModalComponent } from '../transactions/add-transaction-modal.component';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [IonicModule],
})
export class TabsPage {

  constructor(private modalCtrl: ModalController) {}

  async openAddTransaction() {
    const modal = await this.modalCtrl.create({
      component: AddTransactionModalComponent,
      cssClass: 'add-transaction-modal'
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role === 'confirm') {
      console.log('Transaction added:', data);
    }
  }

}
