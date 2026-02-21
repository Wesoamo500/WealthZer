import { Component, OnInit, ViewChild } from '@angular/core';
import { IonContent, IonicModule } from '@ionic/angular';
import { AdvisorService } from '../core/services/advisor.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Message {
  sender: string;
  text?: string;
  time: string;
  type?: string;
  title?: string;
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
        this.messages = res.map(m => ({
          sender: m.role === 'USER' ? 'user' : 'ai',
          text: m.message,
          time: new Date(m.createdAt || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'text'
        }));
        this.isLoading = false;
        setTimeout(() => this.content.scrollToBottom(300), 100);
      },
      error: (err) => {
        console.error('Error loading chat history:', err);
        this.isLoading = false;
      }
    });
  }

  sendMessage() {
    if (!this.newMessage.trim()) return;
    
    const userMsg = this.newMessage;
    this.messages.push({
      sender: 'user',
      text: userMsg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text'
    });
    
    this.newMessage = '';
    setTimeout(() => this.content.scrollToBottom(300), 100);

    this.advisorService.sendMessage(userMsg).subscribe(res => {
      this.messages.push({
        sender: 'ai',
        text: res.message,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'text'
      });
      setTimeout(() => this.content.scrollToBottom(300), 300);
    });
  }
}
