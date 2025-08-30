import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'DoMusic';
  http = inject(HttpClient)

 ngOnInit() {
  //preiua date
  const saved = localStorage.getItem('userProgress');
  if (saved) {
    try {
      const progress = JSON.parse(saved);
      if (progress && typeof progress === 'object') {
        const headers = new HttpHeaders({
          'Content-Type': 'application/json'
        });

        this.http.post('http://localhost:8000/save-progress', progress, { headers }).subscribe({
          next: () => {
            console.log('Progres salvat în backend');
            localStorage.removeItem('userProgress');
          },
          error: (err) => {
            console.error('Eroare la salvarea progresului:', err);
          }
        });
      }
    } catch (e) {
      console.error('Date corupte în localStorage:', e);
    }
  }
}

}
