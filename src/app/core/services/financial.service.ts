import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  account: string;
  note?: string;
  date: string;
}

export interface PortfolioAsset {
  id: string;
  name: string;
  symbol: string;
  amount: number;
  type: string;
  purchasePrice: number;
  currentValue?: number;
}

@Injectable({
  providedIn: 'root'
})
export class FinancialService {
  constructor(private apiService: ApiService) {}

  getTransactions(): Observable<Transaction[]> {
    return this.apiService.get<Transaction[]>('financial/transactions');
  }

  getPortfolio(): Observable<PortfolioAsset[]> {
    return this.apiService.get<PortfolioAsset[]>('financial/portfolio');
  }

  getNetWorth(): Observable<{ totalNetWorth: number; currency: string }> {
    return this.apiService.get<{ totalNetWorth: number; currency: string }>('financial/net-worth');
  }

  addTransaction(transaction: any): Observable<Transaction> {
    return this.apiService.post<Transaction>('financial/transactions', transaction);
  }

  addAsset(asset: any): Observable<PortfolioAsset> {
    return this.apiService.post<PortfolioAsset>('financial/assets', asset);
  }
}
