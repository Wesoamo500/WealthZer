import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ChatMessage {
  id?: string;
  message: string;
  role: 'USER' | 'ASSISTANT';
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdvisorService {
  constructor(private apiService: ApiService) {}

  getChatHistory(): Observable<ChatMessage[]> {
    return this.apiService.get<ChatMessage[]>('advisor/chat-history');
  }

  sendMessage(message: string): Observable<ChatMessage> {
    return this.apiService.post<ChatMessage>('advisor/ask', { question: message });
  }

  clearChatHistory(): Observable<any> {
    return this.apiService.post('advisor/clear-history', {});
  }
}
