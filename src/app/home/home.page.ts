import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterModule]
})
export class HomePage implements OnInit {

  netWorth = 124592.40;
  dailyChange = 2410.50;
  dailyChangePercent = 1.97;
  
  investments = 84210;
  budget = 1200;

  aiInsight = {
    title: 'Subscription Optimization',
    description: 'I noticed 3 recurring streaming services you haven\'t used in 30 days. Canceling these could save you $42.99/month.',
    action: 'Analyze Subscriptions'
  };

  assets = [
    { name: 'Bitcoin', symbol: 'BTC', amount: '0.82 BTC', value: 54231.20, change: 3.2, icon: 'logo-bitcoin', color: '#f7931a' },
    { name: 'Ethereum', symbol: 'ETH', amount: '4.5 ETH', value: 12145.00, change: -1.4, icon: 'logo-electron', color: '#627eea' }, // Using electron as placeholder for eth
    { name: 'Apple Inc.', symbol: 'AAPL', amount: '42 SHARES', value: 7812.84, change: 0.8, icon: 'logo-apple', color: '#A2AAAD' },
  ];

  recentTransactions = [
    { 
      title: 'Starbucks Coffee', 
      date: 'Today, 08:24 AM', 
      amount: -5.50, 
      icon: 'cafe', 
      iconBg: 'rgba(255, 149, 0, 0.2)',
      iconColor: '#FF9500'
    },
    { 
      title: 'Salary Deposit', 
      date: 'Today, 06:00 AM', 
      amount: 4200.00, 
      icon: 'cash', 
      iconBg: 'rgba(52, 199, 89, 0.2)',
      iconColor: '#34C759'
    },
    { 
      title: 'Amazon Prime', 
      date: 'Today, 02:15 AM', 
      amount: -14.99, 
      icon: 'cart', 
      iconBg: 'rgba(0, 122, 255, 0.2)',
      iconColor: '#007AFF'
    },
  ];

  constructor() {}

  ngOnInit() {}

}
