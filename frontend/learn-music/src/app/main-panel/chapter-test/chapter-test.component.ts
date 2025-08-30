import { Component, output, input, inject } from '@angular/core';
import { ChooseAnswerExerciseComponent } from '../../choose-answer-exercise/choose-answer-exercise.component';
import { WriteAnswerExerciseComponent } from '../../write-answer-exercise/write-answer-exercise.component';
import { Content } from '../../shared/service/contentService';
import { AuthService } from '../../shared/service/authService';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-chapter-test',
  standalone: true,
  imports: [ChooseAnswerExerciseComponent, WriteAnswerExerciseComponent],
  templateUrl: './chapter-test.component.html',
  styleUrl: './chapter-test.component.scss'
})
export class ChapterTestComponent {

  currentIndex = 0
  close = output<boolean>();
  exerciseOrder: number[] = []
  chapterIndex = input<number>();
  userId = 0
  content: Content;
  authService = inject(AuthService)
  http = inject(HttpClient)
  answer = ''
  accuracy = 0
  correctAnswers = 0

  constructor() {
    let userId1 = this.authService.getUserInfoFromToken()?.id
    if (userId1 != undefined)
      this.userId = userId1
    this.content = {
      id: 0,
      is_theory: true,
      id_capitol: 0,
      id_subcapitol: 0,
      text: '',
      need_w_score: false,
      need_show_score: false,
      note: null,
      variante: [],
      raspuns_corect: null,
      need_audio: false,
      need_html: false,
      html_content: ''
    };
  }
  ///voi adauga aici si loader mai tarziu is mesaj de feedvack al raspunsului!!!
  ngOnInit() {
    const encodedName = encodeURIComponent(this.chapterIndex()!);
    const url = `http://localhost:8000/order-test/${encodedName}`;

    this.http.get<number[]>(url).subscribe({
      next: (data) => {
        this.exerciseOrder = data;
        console.log('Ordinea exercițiilor teoretice:', this.exerciseOrder);

        if (this.exerciseOrder.length > 0) {
          this.currentIndex = 0;
          this.getExercise(this.exerciseOrder[this.currentIndex]);
        }
      },
      error: (err) => {
        console.error('Eroare la încărcarea ordinii:', err);
      }
    });
  }
  
  next() {
    this.currentIndex++;
    this.accuracy = this.correctAnswers / this.exerciseOrder.length * 100;
    console.log(this.accuracy)
    if (this.currentIndex < this.exerciseOrder.length) {
      if (this.answer == this.content.raspuns_corect)
        this.correctAnswers++;
      this.getExercise(this.exerciseOrder[this.currentIndex])
    }
    else {
      this.accuracy = this.correctAnswers / this.exerciseOrder.length * 100;
      if (this.accuracy > 80) {
        let nextChapter = this.content.id_capitol + 1
        this.http.get(`/api/update-last-ex/${this.userId}/${nextChapter}`).subscribe((res: any) => {
          console.log(res.message); // "Progres actualizat"
        });
      }
    }
  }

  closeTest() {
    if(this.accuracy>80)
    this.close.emit(true);
    else 
    this.close.emit(false);
  }

  getExercise(idExercise: number) {
    const url = `http://localhost:8000/theory/${idExercise}`;
    this.http.get<Content>(url).subscribe({
      next: (exercise: Content) => {
        this.content = exercise
      },
      error: (err) => {
        console.error('Eroare la preluarea conținutului teoretic:', err);
      }
    });
  }

  handleChosenAnswer(answer: string) {
    this.answer = answer
  }
}
