import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Content {
  id: number;
  is_theory: boolean;
  id_capitol: number;
  id_subcapitol: number;
  text: string;
  need_w_score: boolean;
  need_show_score: boolean;
  note: {note:string[], duration: string[]}| null;
  variante?: string[];
  raspuns_corect?: any;
  need_audio: boolean;
  need_html:boolean,
  html_content: string
}

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private apiUrl = 'http://localhost:8000/content'; 

  constructor(private http: HttpClient) {}

  getNextContent(userId: number): Observable<Content> {
    const url = `${this.apiUrl}/${userId}`;
    return this.http.get<Content>(url);
  }
}
