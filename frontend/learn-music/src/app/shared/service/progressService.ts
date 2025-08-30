import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
@Injectable({
    providedIn: 'root'
})
export class ProgressService {
    private apiUrl = 'http://localhost:8000';
    http = inject(HttpClient);
    sendResultEx(chapterId: number, exId: number, result: number, userId:number) {
        const url = `${this.apiUrl}/result-ex/${chapterId}/${exId}/${userId}/${result}`;
        return this.http.get(url);
    }
}