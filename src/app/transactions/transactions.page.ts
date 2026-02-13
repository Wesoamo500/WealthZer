import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-transactions',
  templateUrl: 'transactions.page.html',
  styleUrls: ['transactions.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class TransactionsPage implements OnInit {

  todayTransactions = [
    { 
      title: 'Starbucks Coffee', 
      subtitle: 'Apple Pay • 08:24 AM', 
      amount: -5.50, 
      icon: 'cafe', 
      iconBg: 'rgba(255, 149, 0, 0.2)',
      iconColor: '#FF9500'
    },
    { 
      title: 'Salary Deposit', 
      subtitle: 'Bank Transfer • 06:00 AM', 
      amount: 4200.00, 
      icon: 'cash', 
      iconBg: 'rgba(52, 199, 89, 0.2)',
      iconColor: '#34C759'
    },
    { 
      title: 'Amazon Prime', 
      subtitle: 'Visa • 1234 • 02:15 AM', 
      amount: -14.99, 
      icon: 'cart', 
      iconBg: 'rgba(0, 122, 255, 0.2)',
      iconColor: '#007AFF'
    },
  ];

  yesterdayTransactions = [
    { 
      title: 'Netflix Inc.', 
      subtitle: 'Mastercard • 5678 • 09:30 PM', 
      amount: -19.99, 
      icon: 'tv', 
      iconBg: 'rgba(175, 82, 222, 0.2)',
      iconColor: '#AF52DE'
    },
    { 
      title: 'Uber Trip', 
      subtitle: 'Apple Pay • 06:45 PM', 
      amount: -24.30, 
      icon: 'car', 
      iconBg: 'rgba(255, 204, 0, 0.2)',
      iconColor: '#FFCC00'
    },
    { 
      title: 'McDonald\'s', 
      subtitle: 'Visa • 1234 • 12:10 PM', 
      amount: -12.45, 
      icon: 'fast-food', 
      iconBg: 'rgba(255, 59, 48, 0.2)',
      iconColor: '#FF3B30'
    },
  ];

  oct22Transactions = [
    { 
      title: 'Electric Utility', 
      subtitle: 'Auto-Pay • 03:00 PM', 
      amount: -89.90, 
      icon: 'flash', 
      iconBg: 'rgba(255, 214, 10, 0.2)',
      iconColor: '#FFD60A'
    },
  ];

  constructor() {}

  ngOnInit() {}

}
