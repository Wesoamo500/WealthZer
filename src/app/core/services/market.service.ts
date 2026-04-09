import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MarketTicker {
  symbol          : string;
  name            : string;
  type            : 'CRYPTO' | 'STOCK';
  price           : number;
  change24h       : number;
  changePercent24h: number;
  marketCap       : string;
  volume24h       : string;
  sparkline7d     : string; // JSON string of price points
  rank            : number;
  color           : string;
  fetchedAt       : string;
}

@Injectable({
  providedIn: 'root'
})
export class MarketService {
  private apiUrl = `${environment.apiUrl}/financial`;
  
  private watchlistSubject = new BehaviorSubject<MarketTicker[]>([]);
  watchlist$ = this.watchlistSubject.asObservable();

  constructor(private http: HttpClient) {}

  getMarkets(category?: string): Observable<MarketTicker[]> {
    const params: any = {};
    if (category && category !== 'all') {
      params.category = category.toUpperCase();
    }
    return this.http.get<MarketTicker[]>(`${this.apiUrl}/markets`, { params });
  }

  searchTickers(query: string): Observable<MarketTicker[]> {
    if (!query.trim()) return of([]);
    return this.http.get<MarketTicker[]>(`${this.apiUrl}/markets/search`, { params: { q: query } });
  }

  loadWatchlist(): void {
    this.http.get<MarketTicker[]>(`${this.apiUrl}/watchlist`).subscribe({
      next: (data) => this.watchlistSubject.next(data),
      error: () => console.error('Failed to load watchlist')
    });
  }

  toggleWatchlist(symbol: string, type: 'CRYPTO' | 'STOCK'): Observable<{ inWatchlist: boolean }> {
    return this.http.post<{ inWatchlist: boolean }>(`${this.apiUrl}/watchlist/toggle`, { symbol, type }).pipe(
      tap(() => this.loadWatchlist()),
      catchError(err => {
        console.error('Toggle watchlist failed', err);
        return of({ inWatchlist: false });
      })
    );
  }
}
