// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { IonicModule, ModalController } from '@ionic/angular';
// import { FinancialService, PortfolioAsset } from '../core/services/financial.service';
// import { AddAssetModalComponent } from './add-asset-modal.component';
// import { CurrencyService } from '../core/services/currency.service';

// @Component({
//   selector: 'app-portfolio',
//   templateUrl: 'portfolio.page.html',
//   styleUrls: ['portfolio.page.scss'],
//   standalone: true,
//   imports: [IonicModule, CommonModule, FormsModule]
// })
// export class PortfolioPage implements OnInit {

//   assets: PortfolioAsset[] = [];
//   totalBalance: number = 0;
//   isLoading: boolean = true;
//   displayCurrency: string = 'GHS';
//   exchangeRate: number = 1;

//   constructor(
//     private financialService: FinancialService,
//     private modalCtrl: ModalController,
//     public currencyService: CurrencyService
//   ) {}

//   ngOnInit() {
//     this.loadPortfolio();
//     this.financialService.transactionUpdate$.subscribe(() => {
//       this.loadPortfolio();
//     });

//     this.currencyService.currencyCode$.subscribe(code => {
//       this.displayCurrency = code;
//     });
//     this.currencyService.exchangeRate$.subscribe(rate => {
//       this.exchangeRate = rate;
//     });
//   }

//   loadPortfolio() {
//     this.isLoading = true;
//     const portfolio$ = this.financialService.getPortfolio();
//     const netWorth$ = this.financialService.getNetWorth();

//     import('rxjs').then(({ forkJoin }) => {
//       forkJoin({
//         portfolio: portfolio$,
//         netWorth: netWorth$
//       }).subscribe({
//         next: (res) => {
//           this.assets = res.portfolio;
//           this.totalBalance = res.netWorth.totalNetWorth;
//           this.isLoading = false;
//         },
//         error: (err) => {
//           console.error('Error loading portfolio:', err);
//           this.isLoading = false;
//         }
//       });
//     });
//   }

//   async openAddAsset() {
//     const modal = await this.modalCtrl.create({
//       component: AddAssetModalComponent,
//       cssClass: 'custom-modal-class'
//     });

//     await modal.present();

//     const { data, role } = await modal.onWillDismiss();

//     if (role === 'confirm' && data) {
//       this.financialService.addAsset(data).subscribe({
//         next: () => {
//           // Home and Portfolio will auto-refresh due to transactionUpdate$ subscription
//         },
//         error: (err) => console.error('Error adding asset:', err)
//       });
//     }
//   }

//   getIconForAsset(type: string): string {
//     const map: any = { 
//       'crypto': 'logo-bitcoin', 
//       'stock': 'trending-up', 
//       'cash': 'wallet-outline' 
//     };
//     return map[type.toLowerCase()] || 'cube-outline';
//   }

//   getBgForAsset(type: string): string {
//     const map: any = { 
//       'crypto': 'rgba(255, 149, 0, 0.2)', 
//       'stock': 'rgba(0, 122, 255, 0.2)', 
//       'cash': 'rgba(52, 199, 89, 0.2)' 
//     };
//     return map[type.toLowerCase()] || 'rgba(142, 142, 147, 0.2)';
//   }

//   getColorForAsset(type: string): string {
//     const map: any = { 
//       'crypto': '#FF9500', 
//       'stock': '#007AFF', 
//       'cash': '#34C759' 
//     };
//     return map[type.toLowerCase()] || '#8E8E93';
//   }
// }
// ============================================================
// portfolio.page.ts — WealthZer · Page 4: Portfolio
// Updated with all 4 empty state scenarios fully wired
// ============================================================
import {
  Component, OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef,
  signal, computed,
} from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonRefresher, IonRefresherContent,
  IonSkeletonText, IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline, chevronForwardOutline,
  searchOutline, refreshOutline, cloudOfflineOutline,
} from 'ionicons/icons';
import { Subject, interval, fromEvent, merge, forkJoin, firstValueFrom } from 'rxjs';
import { takeUntil, startWith, switchMap, debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { PortfolioEmptyStateComponent } from './empty-state/portfolio-empty-state.page';
import { FinancialService, PortfolioAsset } from '../core/services/financial.service';
import { CurrencyService } from '../core/services/currency.service';

export type AssetType = 'all' | 'crypto' | 'stocks' | 'cash' | 'etf' | 'fx';

export interface Asset {
  id: string; symbol: string; name: string;
  type: Exclude<AssetType, 'all'>; quantity: number; unitLabel: string;
  value: number; costBasis: number; changePct: number; changeAmt: number;
  allocationPct: number; color: string;
}

export interface AllocationSegment {
  label: string; pct: number; color: string; value: number;
}

export interface PortfolioSummary {
  totalValue: number; totalReturn: number;
  dailyPnl: number; dailyPnlPct: number; costBasis: number;
}

type Period    = '1D' | '1W' | '1M' | '1Y' | 'All';
type LoadState = 'loading' | 'success' | 'error' | 'offline';

@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.page.html',
  styleUrls: ['./portfolio.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, DecimalPipe, TitleCasePipe,
    ReactiveFormsModule,
    IonContent, IonRefresher, IonRefresherContent,
    IonSkeletonText, IonIcon,
    PortfolioEmptyStateComponent,
  ],
})
export class PortfolioPage implements OnInit, OnDestroy {

  // ── Load state ────────────────────────────────────────────
  loadState    = signal<LoadState>('loading');
  errorMessage = '';
  lastSynced   = '';

  // ── Filter / search ───────────────────────────────────────
  activePeriod : Period    = '1M';
  activeFilter = signal<AssetType>('all');
  searchCtrl   = new FormControl('');

  displayCurrency = signal('USD');
  exchangeRate    = signal(1);

  // ── Data ─────────────────────────────────────────────────
  summary    !: PortfolioSummary;
  allAssets   : Asset[]             = [];
  allocations : AllocationSegment[] = [];

  // ── Donut ────────────────────────────────────────────────
  readonly CIRCUMFERENCE = 439.8;
  donutSegments: { offset: number; dash: number; color: string }[] = [];

  // ── Computed filtered list ────────────────────────────────
  filteredAssets = computed(() => {
    const f = this.activeFilter();
    const q = (this.searchCtrl.value ?? '').toLowerCase().trim();
    return this.allAssets.filter(a => {
      return (f === 'all' || a.type === f)
        && (!q || a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q));
    });
  });

  // ── Empty state computed flags ────────────────────────────
  get isLoading()     : boolean { return this.loadState() === 'loading'; }
  get isNoAssets()    : boolean { return this.loadState() === 'success' && this.allAssets.length === 0; }
  get isFilterEmpty() : boolean {
    return this.loadState() === 'success'
      && this.allAssets.length > 0
      && this.activeFilter() !== 'all'
      && !this.searchCtrl.value?.trim()
      && this.filteredAssets().length === 0;
  }
  get isSearchEmpty() : boolean {
    return this.loadState() === 'success'
      && this.allAssets.length > 0
      && !!this.searchCtrl.value?.trim()
      && this.filteredAssets().length === 0;
  }
  get isLoadError()   : boolean { return this.loadState() === 'error'; }
  get isOffline()     : boolean { return this.loadState() === 'offline'; }
  get showEmptyState(): boolean {
    return this.isNoAssets || this.isFilterEmpty || this.isSearchEmpty
      || this.isLoadError || this.isOffline;
  }
  get showAssetList() : boolean {
    return this.loadState() === 'success' && !this.showEmptyState;
  }
  get searchQuery()   : string  { return this.searchCtrl.value?.trim() ?? ''; }
  get filterLabel()   : string  {
    const f = this.activeFilter();
    return f === 'all' ? '' : f.charAt(0).toUpperCase() + f.slice(1);
  }
  get searchSuggestions(): string[] { return this.allAssets.slice(0, 4).map(a => a.symbol); }

  readonly periods: Period[] = ['1D', '1W', '1M', '1Y', 'All'];
  readonly filterTabs: { label: string; value: AssetType }[] = [
    { label: 'All',    value: 'all'    },
    { label: 'Crypto', value: 'crypto' },
    { label: 'Stocks', value: 'stocks' },
    { label: 'Cash',   value: 'cash'   },
    { label: 'ETF',    value: 'etf'    },
    { label: 'FX',     value: 'fx'     },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private cdr   : ChangeDetectorRef,
    private financialService: FinancialService,
    private currencyService: CurrencyService,
  ) {
    addIcons({ addOutline, chevronForwardOutline, searchOutline, refreshOutline, cloudOfflineOutline });
  }

  async ngOnInit(): Promise<void> {
    this.watchNetworkStatus();
    this.watchSearch();
    this.watchCurrency();
    await this.loadPortfolio();
    this.startPricePolling();
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  // ── Network ───────────────────────────────────────────────
  private watchNetworkStatus(): void {
    merge(
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false)),
    ).pipe(takeUntil(this.destroy$))
     .subscribe(online => {
       if (!online) { this.loadState.set('offline'); this.cdr.markForCheck(); }
       else if (this.loadState() === 'offline') { this.loadPortfolio(); }
     });
  }

  private watchCurrency(): void {
    this.currencyService.currencyCode$.pipe(takeUntil(this.destroy$)).subscribe(code => this.displayCurrency.set(code));
    this.currencyService.exchangeRate$.pipe(takeUntil(this.destroy$)).subscribe(rate => this.exchangeRate.set(rate));
  }

  // ── Load ─────────────────────────────────────────────────
  async loadPortfolio(): Promise<void> {
    if (this.allAssets.length === 0) this.loadState.set('loading');
    try {
      if (!navigator.onLine) { this.loadState.set('offline'); this.cdr.markForCheck(); return; }

      const [netWorth, historical] = await firstValueFrom(
        forkJoin([
          this.financialService.getNetWorth(),
          this.financialService.getHistoricalNetWorth(this.activePeriod)
        ])
      );

      // Map Summary
      this.summary = {
        totalValue: netWorth.totalNetWorth,
        totalReturn: netWorth.totalGainLossPercent,
        dailyPnl: netWorth.dailyChange,
        dailyPnlPct: netWorth.dailyChangePercent,
        costBasis: netWorth.totalInvestments - netWorth.totalGainLoss
      };

      // Map Assets
      this.allAssets = netWorth.assets.map((a: PortfolioAsset) => ({
        id: a.id,
        symbol: a.symbol,
        name: a.name,
        type: a.type.toLowerCase() as any,
        quantity: a.amount,
        unitLabel: a.type === 'CRYPTO' ? 'coins' : (a.type === 'CASH' ? 'units' : 'shares'),
        value: a.currentValue || 0,
        costBasis: a.purchaseValue || 0,
        changePct: a.gainLossPercent || 0,
        changeAmt: a.gainLoss || 0,
        allocationPct: Math.round(a.allocationPct || 0),
        color: this.getColorForAsset(a.type, a.symbol)
      }));

      // Map Allocations
      this.allocations = netWorth.allocations.map((al: any) => ({
        label: al.type.charAt(0).toUpperCase() + al.type.slice(1).toLowerCase(),
        pct: Math.round(al.percentage),
        color: this.getColorForType(al.type),
        value: al.value
      }));

      this.buildDonutSegments();
      this.lastSynced = 'just now';
      this.loadState.set('success');
    } catch (err: any) {
      console.error('Portfolio load error:', err);
      this.errorMessage = err?.message ?? 'connection_error';
      this.lastSynced   = this.lastSynced || 'unknown';
      this.loadState.set('error');
    } finally {
      this.cdr.markForCheck();
    }
  }

  async onRefresh(event: CustomEvent): Promise<void> {
    await this.loadPortfolio();
    (event.detail as any).complete();
  }

  async onPeriodChange(p: Period): Promise<void> {
    this.activePeriod = p;
    this.cdr.markForCheck();
    await this.loadPortfolio(); // Re-fetch with new period context
  }
  onFilterChange(f: AssetType): void { this.activeFilter.set(f); }

  private watchSearch(): void {
    this.searchCtrl.valueChanges.pipe(
      debounceTime(200), distinctUntilChanged(), takeUntil(this.destroy$),
    ).subscribe(() => this.cdr.markForCheck());
  }

  // ── Empty state event handlers ────────────────────────────
  onAddAsset()                         { this.router.navigate(['/tabs/portfolio'], { queryParams: { addAsset: true } }); }
  onImportExchange()                   { this.router.navigate(['/tabs/portfolio'], { queryParams: { import: true } }); }
  onClearFilter()                      { this.activeFilter.set('all'); }
  onClearSearch()                      { this.searchCtrl.setValue(''); }
  onAddFilteredAsset(label: string)    { this.router.navigate(['/tabs/portfolio'], { queryParams: { addAsset: true, type: label.toLowerCase() } }); }
  onAddSearchedAsset(query: string)    { this.router.navigate(['/tabs/portfolio'], { queryParams: { addAsset: true, symbol: query } }); }
  onTapSuggestion(symbol: string)      { this.searchCtrl.setValue(symbol); }
  onRetry()                            { this.loadPortfolio(); }
  onViewCached()                       { /* this.portfolioService.loadFromCache() */ }

  openAsset(asset: Asset): void { this.router.navigate(['/tabs/portfolio/asset', asset.symbol]); }

  private startPricePolling(): void {
    interval(30_000).pipe(
      startWith(0), switchMap(() => this.fetchLivePrices()), takeUntil(this.destroy$),
    ).subscribe(() => this.cdr.markForCheck());
  }

  private async fetchLivePrices(): Promise<void> {
    // Optionally refresh just current prices in the background
    this.financialService.getNetWorth().pipe(takeUntil(this.destroy$)).subscribe(netWorth => {
      // Update specific stats without full reload state
      if (this.summary) {
        this.summary.totalValue = netWorth.totalNetWorth;
        this.summary.dailyPnl = netWorth.dailyChange;
      }
      // ... update others
      this.cdr.markForCheck();
    });
  }

  private buildDonutSegments(): void {
    let offset = 0;
    this.donutSegments = this.allocations.map(seg => {
      const dash = (seg.pct / 100) * this.CIRCUMFERENCE;
      const s = { offset: -offset, dash, color: seg.color };
      offset += dash + 2;
      return s;
    });
  }

  isPositive(val: number): boolean { return val >= 0; }
  barGradient(asset: Asset): string { return `linear-gradient(90deg, ${asset.color}, ${asset.color}88)`; }
  trackById(_: number, a: Asset): string { return a.id; }

  private getColorForAsset(type: string, symbol: string): string {
    if (symbol === 'BTC') return '#F7931A';
    if (symbol === 'ETH') return '#627EEA';
    if (symbol === 'SOL') return '#9945FF';
    return this.getColorForType(type);
  }

  private getColorForType(type: string): string {
    const map: Record<string, string> = {
      'CRYPTO': '#3DD6BC',
      'STOCKS': '#0D5C52',
      'CASH': '#C8712A',
      'ETF': '#5CBAA4',
      'FX': '#A8622D'
    };
    return map[type.toUpperCase()] || '#3DD6BC';
  }

  private seedMockData(): void {
    // No longer needed
  }

  private simulateAsync(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }
}