import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChapterService {
  private apiUrl = 'http://localhost:8000/chapters';

  constructor(private http: HttpClient) { }

  getChapters(): Observable<string[]> {
    return this.http.get<string[]>(this.apiUrl);
  }

  getSubchapters(chapterTitle: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/${encodeURIComponent(chapterTitle)}/subchapters`);
  }

  getIndexOfSubchapter(chapterIndex:number, subIndex:number)
  {
     return this.http.get<string[]>(`${this.apiUrl}/${encodeURIComponent(chapterIndex)}/${encodeURIComponent(subIndex)}`);
  }
}
