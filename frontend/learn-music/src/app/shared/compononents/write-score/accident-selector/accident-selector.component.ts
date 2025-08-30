import { Component, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-accident-selector',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './accident-selector.component.html',
  styleUrl: './accident-selector.component.scss'
})
export class AccidentSelectorComponent {
  accidentSelected=output<string>()
  
  accidents = ['n', '#', 'b'];  
  selectedAccident: string = 'n';

  onSelectAccident(): void {
    this.accidentSelected.emit(this.selectedAccident);
  }
}
