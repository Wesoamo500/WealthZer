// ============================================================
// markets.page.ts — WealthZer · Page 6: Markets
// Sections: Search · Category Tabs · Marquee Strip ·
//           Ticker List with Sparklines · Watchlist
// ============================================================
import {
  Component, OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef,
  signal, computed,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonRefresher, IonRefresherContent,
  IonSkeletonText, IonIcon, IonSearchbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  searchOutline, optionsOutline, starOutline, star,
  trendingUpOutline, trendingDownOutline,
} from 'ionicons/icons';
import { Subject, interval } from 'rxjs';
import { takeUntil, startWith, switchMap, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MarketService, MarketTicker as ApiTicker } from '../core/services/market.service';

// ── Models ─────────────────────────────────────────────────
export type MarketCategory = 'all' | 'crypto' | 'stock' | 'etf' | 'fx';

export interface MarketTicker {
  rank       : number;
  symbol     : string;
  name       : string;
  category   : Exclude<MarketCategory, 'all'>;
  exchange?  : string;
  price      : number;
  changePct  : number;
  changeAmt  : number;
  marketCap? : string;
  volume24h? : string;
  sparkline  : number[];       // array of 8–10 price points for SVG polyline
  color      : string;         // sparkline stroke color
  inWatchlist: boolean;
}

export interface MarqueeItem {
  symbol   : string;
  changePct: number;
}

@Component({
  selector: 'app-markets',
  templateUrl: './markets.page.html',
  styleUrls: ['./markets.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, DecimalPipe,
    IonContent, IonRefresher, IonRefresherContent,
    IonSkeletonText, IonIcon, IonSearchbar,
  ],
})
export class MarketsPage implements OnInit, OnDestroy {

  // ── State ────────────────────────────────────────────────
  isLoading      = true;
  activeCategory = signal<MarketCategory>('all');
  searchCtrl     = new FormControl('');

  // ── Data ─────────────────────────────────────────────────
  allTickers  : MarketTicker[] = [];
  marqueeItems: MarqueeItem[]  = [];

  // ── Computed filtered + searched list ────────────────────
  displayedTickers = computed(() => {
    const cat = this.activeCategory();
    const q   = (this.searchCtrl.value ?? '').toLowerCase().trim();

    return this.allTickers.filter(t => {
      const catMatch = cat === 'all' || t.category === cat;
      const qMatch   = !q
        || t.symbol.toLowerCase().includes(q)
        || t.name.toLowerCase().includes(q);
      return catMatch && qMatch;
    });
  });

  readonly categories: { label: string; value: MarketCategory }[] = [
    { label: 'All',    value: 'all'    },
    { label: 'Crypto', value: 'crypto' },
    { label: 'Stocks', value: 'stock'  },
  ];

  // SVG sparkline viewport dimensions
  readonly SPARK_W = 60;
  readonly SPARK_H = 30;

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private cdr   : ChangeDetectorRef,
    private marketService: MarketService,
  ) {
    addIcons({
      searchOutline, optionsOutline, starOutline, star,
      trendingUpOutline, trendingDownOutline,
    });
  }

  // ────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadMarkets();
    this.startPricePolling();
    this.watchSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Initial data load ─────────────────────────────────────
  async loadMarkets(): Promise<void> {
    this.isLoading = true;
    try {
      this.marketService.getMarkets().subscribe({
        next: (data) => {
          this.allTickers = data.map(t => this.mapApiToUi(t));
          this.marqueeItems = this.allTickers.slice(0, 8).map(t => ({
            symbol: t.symbol, changePct: t.changePct
          }));
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
      this.marketService.loadWatchlist();
    } catch {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  private mapApiToUi(api: ApiTicker): MarketTicker {
    return {
      rank       : api.rank || 999,
      symbol     : api.symbol,
      name       : api.name || api.symbol,
      category   : api.type.toLowerCase() as any,
      price      : api.price,
      changePct  : api.changePercent24h || 0,
      changeAmt  : api.change24h || 0,
      marketCap  : api.marketCap,
      volume24h  : api.volume24h,
      sparkline  : JSON.parse(api.sparkline7d || '[]'),
      color      : api.color || (api.change24h >= 0 ? '#3DD6BC' : '#B93535'),
      inWatchlist: false // Will be updated by watchlist subscription
    };
  }

  // ── Pull-to-refresh ───────────────────────────────────────
  async onRefresh(event: CustomEvent): Promise<void> {
    await this.loadMarkets();
    (event.detail as any).complete();
  }

  // ── Category filter ───────────────────────────────────────
  setCategory(cat: MarketCategory): void {
    this.activeCategory.set(cat);
  }

  // ── Search debounce ───────────────────────────────────────
  private watchSearch(): void {
    this.searchCtrl.valueChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(() => this.cdr.markForCheck());
  }

  // ── Toggle watchlist ──────────────────────────────────────
  async toggleWatchlist(ticker: MarketTicker, event: Event): Promise<void> {
    event.stopPropagation();
    this.marketService.toggleWatchlist(ticker.symbol, ticker.category.toUpperCase() as any).subscribe({
      next: (res) => {
        ticker.inWatchlist = res.inWatchlist;
        this.cdr.markForCheck();
      }
    });
  }

  // ── Navigate to detail ────────────────────────────────────
  openDetail(ticker: MarketTicker): void {
    this.router.navigate(['/tabs/markets', ticker.symbol]);
  }

  // ── Live price polling (every 15s for markets) ────────────
  private startPricePolling(): void {
    interval(15_000).pipe(
      startWith(0),
      switchMap(() => this.refreshPrices()),
      takeUntil(this.destroy$),
    ).subscribe(() => this.cdr.markForCheck());
  }

  private async refreshPrices(): Promise<void> {
    if (this.isLoading) return;
    this.marketService.getMarkets().subscribe(data => {
      this.allTickers = data.map(t => this.mapApiToUi(t));
      this.marqueeItems = this.allTickers.slice(0, 8).map(t => ({
        symbol: t.symbol, changePct: t.changePct
      }));
      this.cdr.markForCheck();
    });
  }

  // ── Sparkline SVG polyline points ─────────────────────────
  // Converts raw price array → "x1,y1 x2,y2 ..." SVG points string
  sparklinePoints(prices: number[]): string {
    if (!prices.length) return '';
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const step  = this.SPARK_W / (prices.length - 1);

    return prices.map((p, i) => {
      const x = i * step;
      const y = this.SPARK_H - ((p - min) / range) * (this.SPARK_H - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  // Polygon fill points (closes the shape to the bottom)
  sparklineFill(prices: number[]): string {
    if (!prices.length) return '';
    const pts   = this.sparklinePoints(prices);
    const lastX = (prices.length - 1) * (this.SPARK_W / (prices.length - 1));
    return `${pts} ${lastX.toFixed(1)},${this.SPARK_H} 0,${this.SPARK_H}`;
  }

  // ── Helpers ───────────────────────────────────────────────
  isPositive(val: number): boolean { return val >= 0; }

  formatMarketCap(cap?: string): string {
    return cap ?? '—';
  }

  trackBySymbol(_: number, t: MarketTicker): string { return t.symbol; }

  // ── Today's date label ────────────────────────────────────
  get todayLabel(): string {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
    });
  }
}