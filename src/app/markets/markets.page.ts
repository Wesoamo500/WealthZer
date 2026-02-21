import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-markets',
  templateUrl: 'markets.page.html',
  styleUrls: ['markets.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class MarketsPage implements OnInit {
  isLoading: boolean = true;

  constructor() {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading = true;
    // Simulate API delay
    setTimeout(() => {
      this.isLoading = false;
    }, 1500);
  }
}
