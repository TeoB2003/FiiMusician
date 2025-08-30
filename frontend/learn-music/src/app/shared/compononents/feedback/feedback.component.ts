import { NgClass } from '@angular/common';
import { Component, input, NgModule } from '@angular/core';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [NgClass],
  templateUrl: './feedback.component.html',
  styleUrl: './feedback.component.scss'
})
export class FeedbackComponent {
  feedbackClass=input("")
  feedbackMessage=input("")
}
