// ============================================================
// portfolio-empty-state.component.ts
// WealthZer · Reusable empty state for all 4 portfolio states
// ============================================================
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline, refreshOutline, searchOutline,
  cloudOfflineOutline, filterOutline,
} from 'ionicons/icons';

export type PortfolioEmptyVariant =
  | 'no-assets'       // brand new user, nothing added
  | 'filter-empty'    // active filter returns 0 results
  | 'search-empty'    // active search query returns 0 results
  | 'load-error'      // network/API failure
  | 'offline';        // device is offline, no cache

@Component({
  selector: 'app-portfolio-empty-state',
  templateUrl: './portfolio-empty-state.page.html',
  styleUrls: ['./portfolio-empty-state.page.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon],
})
export class PortfolioEmptyStateComponent {

  // ── Inputs ───────────────────────────────────────────────
  @Input() variant     : PortfolioEmptyVariant = 'no-assets';
  @Input() filterLabel : string = '';    // e.g. "ETF" for filter-empty
  @Input() searchQuery : string = '';    // e.g. "DOGE" for search-empty
  @Input() errorMessage: string = '';    // e.g. "network_timeout" for load-error
  @Input() lastSynced  : string = '';    // e.g. "14 min ago" for load-error
  @Input() suggestions : string[] = []; // quick-tap asset suggestions for search-empty

  // ── Outputs ──────────────────────────────────────────────
  @Output() addAsset        = new EventEmitter<void>();
  @Output() importExchange  = new EventEmitter<void>();
  @Output() clearFilter     = new EventEmitter<void>();
  @Output() addFilteredAsset= new EventEmitter<string>(); // emits filterLabel
  @Output() clearSearch     = new EventEmitter<void>();
  @Output() addSearchedAsset= new EventEmitter<string>(); // emits searchQuery
  @Output() tapSuggestion   = new EventEmitter<string>(); // emits suggestion symbol
  @Output() retry           = new EventEmitter<void>();
  @Output() viewCached      = new EventEmitter<void>();

  constructor() {
    addIcons({
      addOutline, refreshOutline, searchOutline,
      cloudOfflineOutline, filterOutline,
    });
  }
}