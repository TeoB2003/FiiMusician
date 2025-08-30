import { Component, inject,input, NgModule, output } from '@angular/core';
import { WriteScoreComponent } from "../shared/compononents/write-score/write-score.component";
import { FormsModule } from '@angular/forms'
import { Note } from '../shared/models/note';

@Component({
  selector: 'app-write-answer-exercise',
  standalone: true,
  imports: [WriteScoreComponent, FormsModule],
  templateUrl: './write-answer-exercise.component.html',
  styleUrl: './write-answer-exercise.component.scss'
})

export class WriteAnswerExerciseComponent {
    needScore=input(true)  
    questionText=input("Ce interval este intre notele do si mi?")
    correctAnswer=input('')

    isCorrect=output<boolean>()
    answer:string="";

    verifyAnswer() {
      if(this.answer==this.correctAnswer())
        this.isCorrect.emit(true);
      else{
        this.isCorrect.emit(false)
      }
      console.log(this.answer)
    }

    printNotes(event:Note[])
    {
        console.log(event)
    }
}