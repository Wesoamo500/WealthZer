import { Component, OnInit, ViewChild } from '@angular/core';
import { IonContent, IonicModule } from '@ionic/angular';
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

  messages: Message[] = [
    {
      sender: 'user',
      text: 'How is my spending looking so far this month?',
      time: '10:24 AM'
    },
    {
      sender: 'ai',
      text: 'I’ve analyzed your recent transactions. You’ve spent 15% more on "Dining Out" compared to your 3-month average.',
      type: 'text',
      time: '10:24 AM'
    },
    {
      sender: 'ai',
      type: 'card',
      title: 'Optimize Budget',
      data: {
        cap: 120.00,
        current: 90
      },
      time: '10:25 AM'
    }
  ];

  newMessage = '';

  constructor() {}

  ngOnInit() {}

  sendMessage() {
    if (!this.newMessage.trim()) return;
    
    this.messages.push({
      sender: 'user',
      text: this.newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    
    this.newMessage = '';
    
    setTimeout(() => {
      this.content.scrollToBottom(300);
    }, 100);

    // Mock response
    setTimeout(() => {
        this.messages.push({
            sender: 'ai',
            text: 'I can help you set a new budget limit for dining out. Would you like to proceed?',
            type: 'text',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        this.content.scrollToBottom(300);
    }, 1500);
  }
}
