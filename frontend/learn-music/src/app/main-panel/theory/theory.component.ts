import { HttpClient } from '@angular/common/http';
import { Component, inject, input, output } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Content } from '../../shared/service/contentService';

@Component({
  selector: 'app-theory',
  standalone: true,
  imports: [],
  templateUrl: './theory.component.html',
  styleUrl: './theory.component.scss'
})
export class TheoryComponent {
  chapterName = input();
  subchapterName = input<string>();
  close = output();
  safeHtml!: SafeHtml;
  theoryOrder: number[] = []
  currentIndex = 0

  sanitizer=inject(DomSanitizer)
  private http = inject(HttpClient)

  ngOnInit() {
    const encodedName = encodeURIComponent(this.subchapterName()!);
    const url = `http://localhost:8000/order/${encodedName}`;

    this.http.get<number[]>(url).subscribe({
      next: (data) => {
        this.theoryOrder = data;
        console.log('Ordinea exercițiilor teoretice:', this.theoryOrder);

        if (this.theoryOrder.length > 0) {
          this.currentIndex = 0;
          this.getTheory(this.theoryOrder[this.currentIndex]);
        }
      },
      error: (err) => {
        console.error('Eroare la încărcarea ordinii:', err);
      }
    });
  }

  getTheory(id: number) {
    const url = `http://localhost:8000/theory/${id}`;
    this.http.get<Content>(url).subscribe({
      next: (htmlContent: Content) => {
        this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(htmlContent.text);
      },
      error: (err) => {
        console.error('Eroare la preluarea conținutului teoretic:', err);
      }
    });
  }

  next()
  {
    this.currentIndex++;
    this.getTheory(this.theoryOrder[this.currentIndex])
  }

  back()
  {
    this.currentIndex--
    this.getTheory(this.theoryOrder[this.currentIndex])
  }

  closeTheory() {
    this.close.emit();
  }

}
