// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { IonicModule, ToastController, ModalController } from '@ionic/angular';
// import { FinancialService, Budget, Transaction } from '../core/services/financial.service';
// import { AddBudgetModalComponent } from './add-budget-modal.component';
// import { CurrencyService } from '../core/services/currency.service';

// @Component({
//   selector: 'app-budgets',
//   templateUrl: './budgets.page.html',
//   styleUrls: ['./budgets.page.scss'],
//   standalone: true,
//   imports: [IonicModule, CommonModule, FormsModule]
// })
// export class BudgetsPage implements OnInit {
//   budgets: Budget[] = [];
//   allTransactions: Transaction[] = [];
//   totalMonthlyIncome: number = 0;
//   totalBudgetLimit: number = 0;
//   totalSpent: number = 0;
//   isLoading: boolean = true;
//   displayCurrency: string = 'USD';
//   exchangeRate: number = 1;

//   categories = [
//     { id: 'DINING', label: 'Dining', icon: 'restaurant' },
//     { id: 'GROCERIES', label: 'Groceries', icon: 'cart' },
//     { id: 'TRANSPORT', label: 'Transport', icon: 'car' },
//     { id: 'FUN', label: 'Fun', icon: 'game-controller' },
//     { id: 'OTHERS', label: 'Others', icon: 'ellipsis-horizontal' }
//   ];

//   constructor(
//     private financialService: FinancialService,
//     private toastCtrl: ToastController,
//     private modalCtrl: ModalController,
//     public currencyService: CurrencyService
//   ) {}

//   ngOnInit() {
//     this.loadData();
//     this.financialService.budgetUpdate$.subscribe(() => this.loadData());
//     this.financialService.transactionUpdate$.subscribe(() => this.loadData());

//     this.currencyService.currencyCode$.subscribe(code => {
//       this.displayCurrency = code;
//     });
//     this.currencyService.exchangeRate$.subscribe(rate => {
//       this.exchangeRate = rate;
//     });
//   }

//   loadData() {
//     this.isLoading = true;
//     this.financialService.getBudgets().subscribe(res => {
//       this.budgets = res;
//       this.calculateTotals();
//     });
//     this.financialService.getTransactions().subscribe(res => {
//       this.allTransactions = res;
//       this.calculateTotals();
//     });
//     this.financialService.getNetWorth().subscribe(res => {
//       this.totalMonthlyIncome = res.totalIncome;
//       this.isLoading = false;
//     }, () => this.isLoading = false);
//   }

//   calculateTotals() {
//     this.totalBudgetLimit = this.budgets.reduce((sum, b) => sum + Number(b.amount), 0);
//     this.totalSpent = this.budgets.reduce((sum, b) => sum + this.calculateSpentForCategory(b.category), 0);
//   }

//   async openAddBudget() {
//     const modal = await this.modalCtrl.create({
//       component: AddBudgetModalComponent,
//       cssClass: 'custom-modal-class'
//     });

//     await modal.present();

//     const { data, role } = await modal.onWillDismiss();

//     if (role === 'confirm' && data) {
//       this.financialService.addBudget(data).subscribe({
//         next: () => {
//           this.showToast('Budget updated successfully!');
//           // Subscription will refresh data
//         },
//         error: () => this.showToast('Error saving budget.')
//       });
//     }
//   }

//   getCategoryIcon(categoryId: string): string {
//     return this.categories.find(c => c.id === categoryId)?.icon || 'help-outline';
//   }

//   getBudgetForCategory(categoryId: string): Budget | undefined {
//     return this.budgets.find(b => b.category === categoryId);
//   }

//   calculateSpentForCategory(categoryId: string): number {
//     return this.allTransactions
//       .filter(t => t.category === categoryId && t.amount < 0)
//       .reduce((sum, t) => sum + Math.abs(t.amount), 0);
//   }

//   getImpactPercentage(categoryId: string): number {
//     const budget = this.getBudgetForCategory(categoryId);
//     if (!budget || budget.amount === 0) return 0;
//     const spent = this.calculateSpentForCategory(categoryId);
//     return Math.min(Math.round((spent / budget.amount) * 100), 100);
//   }

//   getRemainingAmount(categoryId: string): number {
//     const budget = this.getBudgetForCategory(categoryId);
//     if (!budget) return 0;
//     const spent = this.calculateSpentForCategory(categoryId);
//     return Math.max(budget.amount - spent, 0);
//   }

//   async deleteBudget(id: string) {
//     // Optional: Add delete functionality if service supports it
//   }

//   private async showToast(message: string) {
//     const toast = await this.toastCtrl.create({
//       message,
//       duration: 2000,
//       position: 'top'
//     });
//     await toast.present();
//   }
// }
// ============================================================
// budgets.page.ts — WealthZer · Page 7a: Budgets
// Sections: Monthly Summary · Category Grid · Add Budget Modal
// ============================================================
import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent, IonRefresher, IonRefresherContent,
  IonModal, IonHeader, IonToolbar, IonTitle,
  IonButtons, IonButton, IonIcon, IonSkeletonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline, chevronForwardOutline,
  alertCircleOutline, checkmarkCircleOutline,
  ellipseOutline,
} from 'ionicons/icons';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { FinancialService } from '../core/services/financial.service';
import { CurrencyService } from '../core/services/currency.service';

// ── Models ─────────────────────────────────────────────────
export type BudgetStatus = 'ok' | 'warning' | 'over' | 'unused';

export interface BudgetCategory {
  id         : string;
  name       : string;
  emoji      : string;
  spent      : number;
  limit      : number;
  status     : BudgetStatus;
  color      : string;
}

export interface BudgetSummary {
  month         : string;
  totalSpent    : number;
  totalLimit    : number;
  onTrackCount  : number;
  totalCategories: number;
  daysRemaining : number;
}

@Component({
  selector: 'app-budgets',
  templateUrl: './budgets.page.html',
  styleUrls: ['./budgets.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule, CurrencyPipe, ReactiveFormsModule,
    IonContent, IonRefresher, IonRefresherContent,
    IonModal, IonHeader, IonToolbar, IonTitle,
    IonButtons, IonButton, IonIcon, IonSkeletonText,
  ],
})
export class BudgetsPage implements OnInit {

  // ── State ────────────────────────────────────────────────
  isLoading     = true;
  showAddModal  = false;
  activeSegment : 'overview' | 'categories' = 'overview';

  // ── Data ─────────────────────────────────────────────────
  summary   !: BudgetSummary;
  categories : BudgetCategory[] = [];

  // ── Add budget form ──────────────────────────────────────
  addForm!: FormGroup;

  readonly emojiOptions = ['🍽','🚗','🛍','🏠','💡','💊','🎮','✈️','🎓','💇','🐾','🎁'];

  constructor(
    private fb    : FormBuilder,
    private router: Router,
    private cdr   : ChangeDetectorRef,
    private financialService: FinancialService,
    public currencyService: CurrencyService,
  ) {
    addIcons({
      addOutline, chevronForwardOutline,
      alertCircleOutline, checkmarkCircleOutline, ellipseOutline,
    });
  }

  // ────────────────────────────────────────────────────────
  async ngOnInit(): Promise<void> {
    this.buildForm();
    await this.loadBudgets();
  }

  private buildForm(): void {
    this.addForm = this.fb.group({
      name  : ['', [Validators.required, Validators.minLength(2)]],
      emoji : ['🍽'],
      limit : [null, [Validators.required, Validators.min(1)]],
      period: ['monthly'],
    });
  }

  async loadBudgets(): Promise<void> {
    this.isLoading = true;
    try {
      const data = await this.financialService.getNetWorth().toPromise();
      if (data) {
        this.summary = data.budgetSummary;
        this.categories = data.budgets.map((b: any) => ({
          id: b.id,
          name: this.formatCategoryName(b.category),
          emoji: b.emoji,
          spent: Math.abs(b.spent),
          limit: Number(b.amount),
          status: this.calculateStatus(b),
          color: this.getStatusColor(this.calculateStatus(b))
        }));
      }
    } catch (error) {
      console.error('Failed to load budgets', error);
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  private formatCategoryName(cat: string): string {
    return cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
  }

  private calculateStatus(b: any): BudgetStatus {
    if (b.spent === 0) return 'unused';
    if (b.progress > 100) return 'over';
    if (b.progress > 80) return 'warning';
    return 'ok';
  }

  private getStatusColor(status: BudgetStatus): string {
    switch (status) {
      case 'over': return '#B93535';
      case 'warning': return '#C8712A';
      default: return '#0D5C52';
    }
  }

  async onRefresh(event: CustomEvent): Promise<void> {
    await this.loadBudgets();
    (event.detail as any).complete();
  }

  // ── Category actions ─────────────────────────────────────
  openCategory(cat: BudgetCategory): void {
    this.router.navigate(['/tabs/budgets', cat.id]);
  }

  async openAddModal(): Promise<void> {
    await Haptics.impact({ style: ImpactStyle.Light });
    this.showAddModal = true;
    this.cdr.markForCheck();
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.addForm.reset({ emoji: '🍽', period: 'monthly' });
    this.cdr.markForCheck();
  }

  async onSaveBudget(): Promise<void> {
    if (this.addForm.invalid) { this.addForm.markAllAsTouched(); return; }
    try {
      const val = this.addForm.value;
      await this.financialService.addBudget({
        category: val.name.toUpperCase(), // Mapping simple name to category enum
        amount: val.limit,
        period: val.period
      } as any).toPromise();
      
      await Haptics.impact({ style: ImpactStyle.Medium });
      this.closeAddModal();
      await this.loadBudgets();
    } catch (error) {
      console.error('Failed to save budget', error);
    }
  }

  // ── Template helpers ─────────────────────────────────────
  fillPct(cat: BudgetCategory): number {
    return Math.min((cat.spent / cat.limit) * 100, 100);
  }

  remaining(cat: BudgetCategory): number {
    return cat.limit - cat.spent;
  }

  get totalFillPct(): number {
    return Math.min((this.summary?.totalSpent / this.summary?.totalLimit) * 100, 100);
  }

  trackById(_: number, cat: BudgetCategory): string { return cat.id; }

  // ── Mock data ─────────────────────────────────────────────
  private simulateAsync(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}