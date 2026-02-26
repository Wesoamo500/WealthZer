import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, Event } from '@angular/router';
import { IonicModule, ModalController } from '@ionic/angular';
import { AddTransactionModalComponent } from '../transactions/add-transaction-modal.component';
import { FinancialService } from '../core/services/financial.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class TabsPage implements OnInit, OnDestroy {
  isHomePage = true;
  private routerSubscription: any;

  constructor(
    private modalCtrl: ModalController,
    private financialService: FinancialService,
    private router: Router
  ) {}

  ngOnInit() {
    this.checkCurrentRoute();
    this.routerSubscription = this.router.events.subscribe((event: Event) => {
      if (event instanceof NavigationEnd) {
        this.checkCurrentRoute();
      }
    });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  private checkCurrentRoute() {
    this.isHomePage = this.router.url.includes('/home') || this.router.url.includes('/transactions') || this.router.url === '/tabs' || this.router.url === '/';
  }

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
