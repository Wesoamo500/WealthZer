import { Component, OnInit, ViewChild } from '@angular/core';
import { IonContent, IonicModule } from '@ionic/angular';
import { AdvisorService } from '../core/services/advisor.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Message {
  sender: string;
  text?: string;
  time: string;
  createdAt: Date;
  type?: string;
  title?: string;
  isLoading?: boolean;
  data?: {
    cap: number;
    current: number;
  };
}

@Component({
  selector: 'app-advisor',
  templateUrl: 'advisor.page.html',
  styleUrls: ['advisor.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AdvisorPage implements OnInit {
  @ViewChild(IonContent) content!: IonContent;

  messages: Message[] = [];
  newMessage = '';
  isLoading: boolean = true;

  constructor(private advisorService: AdvisorService) {}

  ngOnInit() {
    this.loadChatHistory();
  }

  loadChatHistory() {
    this.isLoading = true;
    this.advisorService.getChatHistory().subscribe({
      next: (res) => {
        this.messages = res.map(m => {
          const date = new Date(m.createdAt || '');
          return {
            sender: m.role === 'USER' ? 'user' : 'ai',
            text: m.message,
            time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: date,
            type: 'text'
          };
        });
        this.isLoading = false;
        setTimeout(() => this.content?.scrollToBottom(300), 100);
      },
      error: (err) => {
        console.error('Error loading chat history:', err);
        this.isLoading = false;
      }
    });
  }

  get isChatEmpty(): boolean {
    return !this.isLoading && this.messages.length === 0;
  }

  selectSuggestedQuestion(question: string) {
    this.newMessage = question;
    this.sendMessage();
  }

  clearChat() {
    this.advisorService.clearChatHistory().subscribe({
        next: () => {
            this.messages = [];
        },
        error: (err) => console.error('Error clearing chat:', err)
    });
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;
    
    const userMsg = this.newMessage;
    const now = new Date();
    this.messages.push({
      sender: 'user',
      text: userMsg,
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: now,
      type: 'text'
    });
    
    this.newMessage = '';
    setTimeout(() => this.content?.scrollToBottom(300), 100);

    // Show a loading bubble for the AI while waiting
    const aiDate = new Date();
    const loadingIdx = this.messages.push({
      sender: 'ai',
      text: '<div class="typing-indicator"><span></span><span></span><span></span></div>',
      time: aiDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: aiDate,
      type: 'text',
      isLoading: true
    }) - 1;
    setTimeout(() => this.content?.scrollToBottom(300), 100);

    this.advisorService.sendMessage(userMsg).subscribe({
        next: (res) => {
          const successDate = new Date();
          this.messages[loadingIdx] = {
            sender: 'ai',
            text: res.message,
            time: successDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: successDate,
            type: 'text'
          };
          setTimeout(() => this.content?.scrollToBottom(300), 300);
        },
        error: (err) => {
          const errorDate = new Date();
          this.messages[loadingIdx] = {
            sender: 'ai',
            text: "Network error occurred.",
            time: errorDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: errorDate,
            type: 'text'
          };
        }
    });
  }

  showDateDivider(msg: Message, index: number): boolean {
    if (index === 0) return true;
    const prevMsg = this.messages[index - 1];
    return this.getDateLabel(msg.createdAt) !== this.getDateLabel(prevMsg.createdAt);
  }

  getDateLabel(date: Date): string {
    const now = new Date();
    const messageDate = new Date(date);
    
    // Clear time for date comparison
    now.setHours(0, 0, 0, 0);
    messageDate.setHours(0, 0, 0, 0);

    const diffTime = now.getTime() - messageDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) {
      return messageDate.toLocaleDateString([], { weekday: 'long' });
    }
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }

}
