import { Component, output, input, inject } from '@angular/core';
import { ChooseAnswerExerciseComponent } from '../../choose-answer-exercise/choose-answer-exercise.component';
import { WriteAnswerExerciseComponent } from '../../write-answer-exercise/write-answer-exercise.component';
import { Content } from '../../shared/service/contentService';
import { AuthService } from '../../shared/service/authService';
import { HttpClient } from '@angular/common/http';
import { ProgressService } from '../../shared/service/progressService';

@Component({
  selector: 'app-unresolved-exercise',
  standalone: true,
  imports: [ChooseAnswerExerciseComponent, WriteAnswerExerciseComponent],
  templateUrl: './unresolved-exercise.component.html',
  styleUrl: './unresolved-exercise.component.scss'
})
export class UnresolvedExerciseComponent {
  currentIndex = 0
  close = output();
  exerciseOrder: number[] = []
  chapterIndex = input<number>();
  userId = 0
  content: Content;
  authService = inject(AuthService)
  http = inject(HttpClient)
  progressService=inject(ProgressService)
  answer = ''

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

  ngOnInit() {
    const idUser = encodeURIComponent(this.userId);
    //schimb URL
    const url = `http://localhost:8000/unresolved-exercise/${idUser}`;

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
    if (this.currentIndex < this.exerciseOrder.length) {
      if (this.answer == this.content.raspuns_corect) {
        console.log("Corect");
        this.progressService.sendResultEx(this.content.id_capitol, this.content.id, 1, this.userId).subscribe(
          {
            next: (response) => {
              console.log(response)
            }
          }
        )
      }
      this.getExercise(this.exerciseOrder[this.currentIndex])
    }
    //pe else se schimba doar interfata in sensul ca dau mesaj ca nu mai ai exercitii de parcurs
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

  closeModal() {
    this.close.emit();
  }
}
