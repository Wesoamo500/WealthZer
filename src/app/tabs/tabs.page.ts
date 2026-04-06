// ============================================================
// tabs.page.ts — WealthZer · Root Tab Layout
// Tabs: Dashboard · Portfolio · Quick Add (FAB) · Advisor · Markets
// ============================================================
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonTabs, IonTabBar, IonTabButton,
  IonIcon, IonLabel, IonFab, IonFabButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline,        home,
  barChartOutline,    barChart,
  addOutline,
  personOutline,      person,
  trendingUpOutline,  trendingUp,
} from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    IonTabs, IonTabBar, IonTabButton,
    IonIcon, IonLabel, IonFab, IonFabButton,
  ],
})
export class TabsPage {

  // Track active tab for active-state icon swap (filled vs outline)
  activeTab = 'dashboard';

  constructor() {
    addIcons({
      homeOutline, home,
      barChartOutline, barChart,
      addOutline,
      personOutline, person,
      trendingUpOutline, trendingUp,
    });
  }

  onTabChange(event: { tab: string }): void {
    this.activeTab = event.tab;
  }
}