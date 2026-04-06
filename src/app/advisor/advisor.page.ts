// advisor.page.ts — WealthZer · Page 5: AI Advisor
// Full conversational UI with streaming responses,
// smart reply chips, voice input, markdown support
// ============================================================
import {
  Component, OnInit, OnDestroy, AfterViewChecked,
  ViewChild, ElementRef, ChangeDetectionStrategy,
  ChangeDetectorRef, signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonIcon, IonSpinner, IonButton,
  IonButtons, IonToolbar, IonHeader, IonTitle, IonBackButton,
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  micOutline, sendOutline, ellipsisVerticalOutline,
  chevronBackOutline, sparklesOutline,
} from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AdvisorService } from '../core/services/advisor.service';
import { AuthService } from '../core/services/auth.service';
import { VoiceService } from '../core/services/voice.service';

// ── Models ─────────────────────────────────────────────────
export type MessageRole = 'user' | 'assistant';
export type MessageStatus = 'sending' | 'sent' | 'streaming' | 'error';

export interface ChatMessage {
  id        : string;
  role      : MessageRole;
  content   : string;          // plain text or markdown
  timestamp : Date;
  status    : MessageStatus;
  isThinking: boolean;        // shows typing dots
}

export interface SmartReply {
  label  : string;
  prompt : string;
}

export interface DateGroup {
  date    : Date;
  label   : string;            // 'Today', 'Yesterday', 'Apr 2', etc.
  messages: ChatMessage[];
}

// ── Unique ID helper ───────────────────────────────────────
let msgId = 0;
const uid = () => `msg-${Date.now()}-${++msgId}`;

@Component({
  selector: 'app-advisor',
  templateUrl: './advisor.page.html',
  styleUrls: ['./advisor.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule, FormsModule, DatePipe, RouterLink,
    IonContent, IonIcon, IonSpinner, IonButton,
    IonButtons, IonToolbar, IonHeader, IonTitle, IonBackButton,
  ],
})
export class AdvisorPage implements OnInit, OnDestroy, AfterViewChecked {

  // ── Scroll anchor ────────────────────────────────────────
  @ViewChild('chatEnd') chatEnd!: ElementRef<HTMLDivElement>;
  @ViewChild('inputEl') inputEl!: ElementRef<HTMLTextAreaElement>;

  // ── State ────────────────────────────────────────────────
  inputText       = '';
  isListening     = false;    // voice input active
  isAiTyping      = false;
  canSend         = signal(false);
  private scrollToBottom = false;

  // ── Message history (grouped by date for display) ─────────
  messages    : ChatMessage[] = [];
  dateGroups  : DateGroup[]   = [];

  // ── Smart reply chips (contextual — updated after each AI msg)
  smartReplies: SmartReply[] = [
    { label: 'How is my budget?',     prompt: 'Give me a summary of my budget this month.' },
    { label: 'Analyse BTC',           prompt: 'Analyse my Bitcoin position and give recommendations.' },
    { label: 'Savings tips',          prompt: 'What are the top 3 ways I can save more this month?' },
    { label: 'Market summary',        prompt: 'Give me a brief summary of today\'s market.' },
    { label: 'Rebalance portfolio',   prompt: 'Should I rebalance my portfolio right now?' },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private cdr: ChangeDetectorRef,
    private advisorService: AdvisorService,
    private authService: AuthService,
    public voiceService: VoiceService,
  ) {
    addIcons({
      micOutline, sendOutline, ellipsisVerticalOutline,
      chevronBackOutline, sparklesOutline,
    });
  }

  // ────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadHistory();
    this.sendWelcomeMessage();
    this.initVoiceListeners();
  }

  private initVoiceListeners(): void {
    // Sync listening state
    this.voiceService.isListening$
      .pipe(takeUntil(this.destroy$))
      .subscribe(listening => {
        this.isListening = listening;
        this.cdr.markForCheck();
      });

    // Real-time transcript sync
    this.voiceService.transcript$
      .pipe(takeUntil(this.destroy$))
      .subscribe(text => {
        if (text) {
          this.inputText = text;
          this.canSend.set(true);
          this.autoGrow();
          this.cdr.markForCheck();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewChecked(): void {
    if (this.scrollToBottom) {
      this.scrollChatToBottom();
      this.scrollToBottom = false;
    }
  }

  // ── Load previous conversation from cache ─────────────────
  private async loadHistory(): Promise<void> {
    this.advisorService.getChatHistory()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (history) => {
          this.messages = history.map(m => ({
            id: m.id || uid(),
            role: m.role.toLowerCase() as MessageRole,
            content: m.message,
            timestamp: m.createdAt ? new Date(m.createdAt) : new Date(),
            status: 'sent',
            isThinking: false
          }));
          this.rebuildDateGroups();
          this.scrollToBottom = true;
          this.cdr.markForCheck();
        },
        error: (err) => console.error('Failed to load chat history:', err)
      });
  }

  // ── Auto welcome on first open ────────────────────────────
  private sendWelcomeMessage(): void {
    const userName = this.authService.currentUserValue?.fullName?.split(' ')[0] || 'there';
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    this.advisorService.getInsight()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          const insight = res.insight || `Welcome back! I'm Zar, your personal financial advisor. How can I help you today?`;
          this.appendAiMessage(`${greeting} ${userName}! 👋 ${insight}`);
        },
        error: () => {
          this.appendAiMessage(`${greeting} ${userName}! 👋 How can I help you today?`);
        }
      });
  }

  // ── Input handler ─────────────────────────────────────────
  onInputChange(val: string): void {
    this.inputText = val;
    this.canSend.set(val.trim().length > 0);
    this.autoGrow();
    this.cdr.markForCheck();
  }

  private autoGrow(): void {
    const el = this.inputEl.nativeElement;
    el.style.height = 'auto';
    // Max 120px height (~5 lines)
    const newHeight = Math.min(el.scrollHeight, 120);
    el.style.height = newHeight + 'px';
  }

  handleEnterKey(event: any): void {
    const ev = event as KeyboardEvent;
    if (ev.shiftKey) {
      // Allow new line
      return;
    }
    ev.preventDefault();
    this.onSend();
  }

  // ── Send message ──────────────────────────────────────────
  async onSend(): Promise<void> {
    const text = this.inputText.trim();
    if (!text) return;

    await Haptics.impact({ style: ImpactStyle.Light });

    // Add user message
    this.appendUserMessage(text);
    this.inputText = '';
    this.canSend.set(false);
    this.cdr.markForCheck();

    // Show typing indicator
    this.isAiTyping = true;
    this.appendThinkingMessage();

    try {
      this.advisorService.sendMessage(text)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.removeThinkingMessage();
            this.appendAiMessage(res.message);
            this.updateSmartReplies(text);
          },
          error: (err) => {
            this.removeThinkingMessage();
            this.appendAiMessage('Sorry, I encountered an issue. Please try again.');
          },
          complete: () => {
            this.isAiTyping = false;
            this.cdr.markForCheck();
          }
        });
    } catch (err) {
      this.removeThinkingMessage();
      this.appendAiMessage('Sorry, I encountered an issue. Please try again.');
      this.isAiTyping = false;
      this.cdr.markForCheck();
    }
  }

  // ── Clear conversation ────────────────────────────────────
  onClearHistory(): void {
    this.advisorService.clearChatHistory()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.messages = [];
          this.dateGroups = [];
          this.sendWelcomeMessage();
          this.cdr.markForCheck();
        },
        error: (err) => console.error('Failed to clear chat history:', err)
      });
  }

  // ── Smart reply tap ───────────────────────────────────────
  async onSmartReply(reply: SmartReply): Promise<void> {
    this.inputText = reply.prompt;
    await this.onSend();
  }

  // ── Voice input ───────────────────────────────────────────
  async onVoiceInput(): Promise<void> {
    await Haptics.impact({ style: ImpactStyle.Medium });

    if (this.isListening) {
      await this.voiceService.stopListening();
    } else {
      this.inputText = '';
      await this.voiceService.startListening();
    }
    this.cdr.markForCheck();
  }

  // ── Message helpers ───────────────────────────────────────
  private appendUserMessage(text: string): void {
    this.messages.push({
      id: uid(), role: 'user', content: text,
      timestamp: new Date(), status: 'sent', isThinking: false,
    });
    this.rebuildDateGroups();
    this.scrollToBottom = true;
  }

  private appendAiMessage(text: string): void {
    this.messages.push({
      id: uid(), role: 'assistant', content: text,
      timestamp: new Date(), status: 'sent', isThinking: false,
    });
    this.rebuildDateGroups();
    this.scrollToBottom = true;
    this.cdr.markForCheck();
  }

  private appendThinkingMessage(): void {
    this.messages.push({
      id: 'thinking', role: 'assistant', content: '',
      timestamp: new Date(), status: 'streaming', isThinking: true,
    });
    this.rebuildDateGroups();
    this.scrollToBottom = true;
    this.cdr.markForCheck();
  }

  private removeThinkingMessage(): void {
    this.messages = this.messages.filter(m => m.id !== 'thinking');
    this.rebuildDateGroups();
  }

  // ── Group messages by date ────────────────────────────────
  private rebuildDateGroups(): void {
    const groups = new Map<string, DateGroup>();

    for (const msg of this.messages) {
      const key = this.dateKey(msg.timestamp);
      if (!groups.has(key)) {
        groups.set(key, {
          date    : msg.timestamp,
          label   : this.dateLabel(msg.timestamp),
          messages: [],
        });
      }
      groups.get(key)!.messages.push(msg);
    }

    this.dateGroups = Array.from(groups.values());
    this.cdr.markForCheck();
  }

  private dateKey(d: Date): string {
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }

  private dateLabel(d: Date): string {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (this.dateKey(d) === this.dateKey(today))     return 'Today';
    if (this.dateKey(d) === this.dateKey(yesterday)) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // ── Smart replies — update contextually ───────────────────
  private updateSmartReplies(lastUserMessage: string): void {
    const msg = lastUserMessage.toLowerCase();

    if (msg.includes('budget')) {
      this.smartReplies = [
        { label: 'Raise dining limit',    prompt: 'Increase my dining budget by $100' },
        { label: 'Budget breakdown',      prompt: 'Show me full budget breakdown' },
        { label: 'Where can I cut costs?',prompt: 'Which categories can I reduce?' },
        { label: 'Savings goal progress', prompt: 'How am I doing on my savings goals?' },
      ];
    } else if (msg.includes('btc') || msg.includes('bitcoin') || msg.includes('crypto')) {
      this.smartReplies = [
        { label: 'Should I buy more BTC?',  prompt: 'Should I add more Bitcoin to my portfolio?' },
        { label: 'ETH vs BTC allocation',   prompt: 'Compare my ETH and BTC allocation' },
        { label: 'Crypto market outlook',   prompt: 'What is the short-term crypto market outlook?' },
        { label: 'Set price alert',          prompt: 'Set a price alert for Bitcoin at $70,000' },
      ];
    } else {
      // Reset to defaults
      this.smartReplies = [
        { label: 'How is my budget?',   prompt: 'Give me a summary of my budget this month.' },
        { label: 'Analyse BTC',         prompt: 'Analyse my Bitcoin position.' },
        { label: 'Savings tips',        prompt: 'Top 3 ways I can save more this month.' },
        { label: 'Market summary',      prompt: 'Brief summary of today\'s market.' },
      ];
    }
    this.cdr.markForCheck();
  }

  // ── TrackBy for ngFor performance ─────────────────────────
  trackByMsgId(_: number, msg: ChatMessage): string { return msg.id; }
  trackByGroupDate(_: number, g: DateGroup): string { return g.label; }

  // ── Scroll to bottom of chat ──────────────────────────────
  private scrollChatToBottom(): void {
    try {
      this.chatEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    } catch {}
  }

  // ── Parse simple markdown bold (**text**) ─────────────────
  // In production use a full markdown pipe (e.g. ngx-markdown)
  parseMd(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  // ── Mock response generator ───────────────────────────────
  private generateMockResponse(input: string): string {
    const q = input.toLowerCase();
    if (q.includes('budget'))
      return 'Your April budget is **94% utilised** with 8 days remaining. Dining is your only category over limit — $80 above your $400 goal.';
    if (q.includes('btc') || q.includes('bitcoin'))
      return 'Bitcoin is up **+3.2%** today at $67,420. Your position of 0.318 BTC is worth **$21,420** — an unrealised gain of $3,420 (+19%). Sentiment is bullish short-term.';
    if (q.includes('sav'))
      return 'Here are your top 3 savings opportunities:\n1. **Dining** — cook 3 meals/week, save ~$80\n2. **Subscriptions** — 2 unused ones detected, save $24/mo\n3. **Transport** — you\'re $90 under budget, redirect to savings.';
    return 'Great question! Based on your current financial data, I recommend reviewing your asset allocation and ensuring your emergency fund covers at least **3 months** of expenses. Would you like a detailed breakdown?';
  }

  private simulateAsync(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}