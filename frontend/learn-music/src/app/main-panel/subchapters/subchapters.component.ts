import { Component, input } from '@angular/core';

@Component({
  selector: 'app-subchapters',
  standalone: true,
  imports: [],
  templateUrl: './subchapters.component.html',
  styleUrl: './subchapters.component.scss'
})
export class SubchaptersComponent {
  isDone=input<boolean>()
  isInProgress=input<boolean>()
  name=input<string>()

  ngOnInit(): void {
  }
}
