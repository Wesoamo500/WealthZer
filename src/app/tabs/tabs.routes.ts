import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () => import('../home/home.page').then(m => m.HomePage)
      },
      {
        path: 'portfolio',
        loadComponent: () => import('../portfolio/portfolio.page').then(m => m.PortfolioPage)
      },
      {
        path: 'advisor',
        loadComponent: () => import('../advisor/advisor.page').then(m => m.AdvisorPage)
      },
      {
        path: 'markets',
        loadComponent: () => import('../markets/markets.page').then(m => m.MarketsPage)
      },
      {
        path: 'budgets',
        loadComponent: () => import('../budgets/budgets.page').then(m => m.BudgetsPage)
      },
      {
        path: 'profile',
        loadComponent: () => import('../profile/profile.page').then(m => m.ProfilePage)
      },
      {
        path: 'transactions',
        loadComponent: () => import('../transactions/transactions.page').then(m => m.TransactionsPage)
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full'
  }
];
