import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
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

export interface Budget {
  id?: string;
  category: string;
  amount: number;
  period: 'monthly' | 'weekly';
  spent: number;
}

@Injectable({
  providedIn: 'root'
})
export class FinancialService {
  private transactionUpdateSubject = new Subject<void>();
  public transactionUpdate$ = this.transactionUpdateSubject.asObservable();

  private budgetUpdateSubject = new Subject<void>();
  public budgetUpdate$ = this.budgetUpdateSubject.asObservable();

  constructor(private apiService: ApiService) {}

  getTransactions(): Observable<Transaction[]> {
    return this.apiService.get<Transaction[]>('financial/transactions');
  }

  getPortfolio(): Observable<PortfolioAsset[]> {
    return this.apiService.get<PortfolioAsset[]>('financial/portfolio');
  }

  getNetWorth(): Observable<{ 
    totalNetWorth: number; 
    totalInvestments: number;
    totalIncome: number;
    totalExpenses: number;
    dailyChange: number;
    dailyChangePercent: number;
    budgets: any[];
    currency: string; 
  }> {
    return this.apiService.get<any>('financial/net-worth');
  }

  getBudgets(): Observable<Budget[]> {
    return this.apiService.get<Budget[]>('financial/budgets');
  }

  addTransaction(transaction: any): Observable<Transaction> {
    return this.apiService.post<Transaction>('financial/transactions', transaction).pipe(
      tap(() => this.transactionUpdateSubject.next())
    );
  }

  addAsset(asset: any): Observable<PortfolioAsset> {
    return this.apiService.post<PortfolioAsset>('financial/assets', asset).pipe(
      tap(() => this.transactionUpdateSubject.next())
    );
  }

  addBudget(budget: Budget): Observable<Budget> {
    return this.apiService.post<Budget>('financial/budgets', budget).pipe(
      tap(() => this.budgetUpdateSubject.next())
    );
  }

  getHealthScore(): Observable<{
    score: number;
    grade: string;
    pillars: { name: string; score: number; max: number }[];
    tip: string;
    comparisonText: string;
    savingsRate: number;
  }> {
    return this.apiService.get<any>('financial/health-score');
  }
}
