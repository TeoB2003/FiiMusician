import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, tap,catchError,throwError } from 'rxjs';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8000';

  http = inject(HttpClient)

  signup(username: string, email: string, password: string): Observable<any> {

    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    const body = {
      username: username,
      emailAdress: email,
      password: this.hashPassword(password)
    };
    
    return this.http.post(`${this.apiUrl}/signup`, body, {headers}).pipe(
      tap((signupResponse: any) => {})
    );
  }

  login(username: string, password: string): Observable<any> {
    const body = {
      username: username,
      password: this.hashPassword(password)
    };
    console.log(username)
    console.log(password)
    console.log("acesta este " + JSON.stringify(body))
  
    return this.http.post(`${this.apiUrl}/login`, body).pipe(
      tap((response: any) => {
        localStorage.setItem('access_token', response.access_token);
      }),
      catchError((error) => {
        if (error.status === 401 ) {
          return throwError(() => new Error('Username sau parola incorecte. Te rog să reintroduci datele.'));
        }
        console.log(error)
        return throwError(() => new Error('A apărut o problemă necunoscută.'));
      })
    );
  }


  logout() {
    localStorage.removeItem('access_token');
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUserInfoFromToken(): { username: string, id: number } | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const payloadBase64 = token.split('.')[1];
      const payloadJson = atob(payloadBase64);
      const payload = JSON.parse(payloadJson);

      return {
        username: payload.sub,
        id: payload.id
      };
    } catch (error) {
      console.error('Error decoding token', error);
      return null;
    }
  }

  hashPassword(password:string) {
    return CryptoJS.SHA256(password).toString();
  }

}