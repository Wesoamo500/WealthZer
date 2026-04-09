// ============================================================
// transactions.page.ts — WealthZer · Page 7b: Transactions
// Sections: Search/Filter Header · Grouped Date List ·
//           Add Transaction Bottom-Sheet Modal
// ============================================================
import {
  Component, OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef, signal,
} from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonRefresher, IonRefresherContent,
  IonModal, IonIcon, IonButton, IonSkeletonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline, searchOutline, optionsOutline,
  arrowUpOutline, arrowDownOutline, swapHorizontalOutline,
  chevronForwardOutline, closeOutline,
} from 'ionicons/icons';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { FinancialService } from '../core/services/financial.service';

// ── Models ─────────────────────────────────────────────────
export type TxnType     = 'expense' | 'income' | 'transfer';
export type TxnCategory =
  'Dining' | 'Transport' | 'Shopping' | 'Bills' | 'Income' |
  'Health' | 'Entertainment' | 'Travel' | 'Transfer' | 'Other';

export interface Transaction {
  id        : string;
  name      : string;
  type      : TxnType;
  category  : TxnCategory;
  amount    : number;        // negative = expense, positive = income/transfer
  date      : Date;
  time      : string;        // '09:14 AM'
  method    : string;        // 'Card' | 'Bank Transfer' | 'Mobile Pay' | etc.
  note?     : string;
}

export interface TxnGroup {
  dateLabel : string;        // 'Today' | 'Yesterday' | 'Apr 1'
  date      : Date;
  dayTotal  : number;        // net for the day
  items     : Transaction[];
}

export type FilterType = 'all' | 'income' | 'expense' | 'transfer';

const CATEGORY_EMOJI: Record<TxnCategory, string> = {
  Dining: '🍽', Transport: '🚗', Shopping: '🛍', Bills: '💡',
  Income: '💰', Health: '💊', Entertainment: '🎮',
  Travel: '✈️', Transfer: '↕', Other: '📦',
};

const CATEGORY_PILL: Record<TxnCategory, string> = {
  Dining: 'pill-dining', Transport: 'pill-transport', Shopping: 'pill-shopping',
  Bills: 'pill-bills', Income: 'pill-income', Health: 'pill-health',
  Entertainment: 'pill-entertainment', Travel: 'pill-travel',
  Transfer: 'pill-transfer', Other: 'pill-other',
};

let txnId = 0;
const uid = () => `txn-${Date.now()}-${++txnId}`;

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.page.html',
  styleUrls: ['./transactions.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, DatePipe, ReactiveFormsModule,
    IonContent, IonRefresher, IonRefresherContent,
    IonModal, IonIcon, IonButton, IonSkeletonText,
  ],
})
export class TransactionsPage implements OnInit, OnDestroy {

  // ── State ────────────────────────────────────────────────
  isLoading    = true;
  showAddModal = false;
  activeFilter = signal<FilterType>('all');

  // ── Data ─────────────────────────────────────────────────
  allTransactions: Transaction[] = [];
  groups         : TxnGroup[]    = [];

  // ── Search ───────────────────────────────────────────────
  searchCtrl = new FormControl('');

  // ── Add transaction form ──────────────────────────────────
  addForm!: FormGroup;
  addType  = signal<TxnType>('expense');

  readonly filterTabs: { label: string; value: FilterType }[] = [
    { label: 'All',      value: 'all'      },
    { label: 'Income',   value: 'income'   },
    { label: 'Expenses', value: 'expense'  },
    { label: 'Transfer', value: 'transfer' },
  ];

  readonly categories: TxnCategory[] = [
    'Dining','Transport','Shopping','Bills',
    'Income','Health','Entertainment','Travel','Transfer','Other',
  ];

  readonly CATEGORY_EMOJI  = CATEGORY_EMOJI;
  readonly CATEGORY_PILL   = CATEGORY_PILL;

  private destroy$ = new Subject<void>();

  constructor(
    private fb    : FormBuilder,
    private router: Router,
    private cdr   : ChangeDetectorRef,
    private financialService: FinancialService,
  ) {
    addIcons({
      addOutline, searchOutline, optionsOutline,
      arrowUpOutline, arrowDownOutline, swapHorizontalOutline,
      chevronForwardOutline, closeOutline,
    });
  }

  // ────────────────────────────────────────────────────────
  async ngOnInit(): Promise<void> {
    this.buildForm();
    await this.loadTransactions();
    this.watchSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForm(): void {
    this.addForm = this.fb.group({
      type    : ['expense'],
      name    : ['', [Validators.required, Validators.minLength(2)]],
      amount  : [null, [Validators.required, Validators.min(0.01)]],
      category: ['Dining'],
      date    : [new Date().toISOString().split('T')[0]],
      note    : [''],
      method  : ['Card'],
    });
  }

  // ── Load ─────────────────────────────────────────────────
  async loadTransactions(): Promise<void> {
    this.isLoading = true;
    try {
      const data = await this.financialService.getTransactions().toPromise();
      if (data) {
        this.allTransactions = data.map((t: any) => ({
          id: t.id,
          name: t.title, // Mapping title to name
          type: this.deriveType(t),
          category: t.category,
          amount: Number(t.amount),
          date: new Date(t.date),
          time: new Date(t.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          method: t.account || 'Card',
          note: t.note
        }));
        this.rebuildGroups();
      }
    } catch (error) {
      console.error('Failed to load transactions', error);
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  private deriveType(t: any): TxnType {
    if (t.category === 'INCOME') return 'income';
    if (t.category === 'TRANSFER') return 'transfer';
    return 'expense';
  }

  async onRefresh(event: CustomEvent): Promise<void> {
    await this.loadTransactions();
    (event.detail as any).complete();
  }

  // ── Filter ───────────────────────────────────────────────
  setFilter(f: FilterType): void {
    this.activeFilter.set(f);
    this.rebuildGroups();
  }

  // ── Search ───────────────────────────────────────────────
  private watchSearch(): void {
    this.searchCtrl.valueChanges.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(() => { this.rebuildGroups(); });
  }

  // ── Group builder ─────────────────────────────────────────
  private rebuildGroups(): void {
    const f = this.activeFilter();
    const q = (this.searchCtrl.value ?? '').toLowerCase().trim();

    const filtered = this.allTransactions.filter(t => {
      const typeOk = f === 'all' || t.type === f;
      const qOk    = !q || t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
      return typeOk && qOk;
    });

    const map = new Map<string, TxnGroup>();
    for (const txn of filtered) {
      const key   = this.dateKey(txn.date);
      const label = this.dateLabel(txn.date);
      if (!map.has(key)) {
        map.set(key, { dateLabel: label, date: txn.date, dayTotal: 0, items: [] });
      }
      const g = map.get(key)!;
      g.items.push(txn);
      g.dayTotal += txn.amount;
    }

    this.groups = Array.from(map.values());
    this.cdr.markForCheck();
  }

  // ── Add transaction modal ─────────────────────────────────
  async openAddModal(): Promise<void> {
    await Haptics.impact({ style: ImpactStyle.Light });
    this.showAddModal = true;
    this.cdr.markForCheck();
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.addForm.reset({ type: 'expense', category: 'Dining', date: new Date().toISOString().split('T')[0], method: 'Card' });
    this.addType.set('expense');
    this.cdr.markForCheck();
  }

  selectType(type: TxnType): void {
    this.addType.set(type);
    this.addForm.get('type')?.setValue(type);
    if (type === 'income') this.addForm.get('category')?.setValue('Income');
    if (type === 'transfer') this.addForm.get('category')?.setValue('Transfer');
  }

  async onSaveTransaction(): Promise<void> {
    if (this.addForm.invalid) { this.addForm.markAllAsTouched(); return; }
    try {
      const val = this.addForm.value;
      const amount = val.type === 'expense' ? -Math.abs(val.amount) : Math.abs(val.amount);
      
      await this.financialService.addTransaction({
        title: val.name,
        amount: amount,
        category: val.category.toUpperCase(),
        account: val.method,
        note: val.note,
        date: val.date
      }).toPromise();

      await Haptics.impact({ style: ImpactStyle.Medium });
      this.closeAddModal();
      await this.loadTransactions();
    } catch (error) {
      console.error('Failed to save transaction', error);
    }
  }

  // ── Navigation ────────────────────────────────────────────
  openDetail(txn: Transaction): void {
    this.router.navigate(['/tabs/transactions', txn.id]);
  }

  // ── Helpers ───────────────────────────────────────────────
  isPositive(val: number): boolean { return val >= 0; }

  private dateKey(d: Date): string {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }

  private dateLabel(d: Date): string {
    const today     = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (this.dateKey(d) === this.dateKey(today))     return 'Today';
    if (this.dateKey(d) === this.dateKey(yesterday)) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  trackByGroup(_: number, g: TxnGroup): string  { return g.dateLabel; }
  trackByTxn  (_: number, t: Transaction): string { return t.id; }

  // ── Mock data ─────────────────────────────────────────────
  private simulateAsync(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}