import { NgClass } from '@angular/common';
import { Component, input, output, ViewChild, ElementRef, inject, effect } from '@angular/core';
import { SafeHtml, DomSanitizer } from '@angular/platform-browser';
import { VexFlow } from 'vexflow';

@Component({
  selector: 'app-choose-answer-exercise',
  standalone: true,
  imports: [NgClass],
  templateUrl: './choose-answer-exercise.component.html',
  styleUrl: './choose-answer-exercise.component.scss'
})
export class ChooseAnswerExerciseComponent {
  @ViewChild('sheet') sheetRef?: ElementRef;

  questionText = input("")
  options = input([""])
  score = input<string[] | null>()
  duration = input<string[] | null>()
  htmlcontent = input('')
  userLevel = input('')

  responeOptions: string[] = []
  chosenAnswer = output<string>()
  selectedAnswer = ''


  safeHtml!: SafeHtml;
  private sanitizer = inject(DomSanitizer);

  constructor() {
    effect(() => {
      const optionsVal = this.options();
      const level = this.userLevel();

      if (optionsVal.length > 3) {
        if (level === 'incepator') {
          this.responeOptions = optionsVal.slice(3);
        } else if (level === 'avansat') {
          this.responeOptions = optionsVal.slice(3, 6);
        } else if (level === 'expert') {
          this.responeOptions = optionsVal.length > 6
            ? optionsVal.slice(6, 9)
            : optionsVal.slice(3, 6);
        }
      } else {
        this.responeOptions = optionsVal;
      }

      console.log("Variante filtrate:", this.responeOptions);
    });

    effect(() => {
      const scoreVal = this.score();
      const durationVal = this.duration();

      if (scoreVal && durationVal) {
        setTimeout(() => this.drawSheet(), 0);
      }
    });
  }


  ngOnInit() {
    console.log("variante raspuns " + this.options())
    if (this.htmlcontent() != '')
      this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(this.htmlcontent());
  }

  chooseAnswer(answer: string) {
    this.selectedAnswer = answer
    this.chosenAnswer.emit(answer)
  }



  drawSheet(): void {
    if (this.score() != null && this.duration() != null) {
      if (!this.sheetRef) return;
      const VF = VexFlow;

      const div = this.sheetRef.nativeElement;
      div.innerHTML = '';

      const width = div.clientWidth;

      const renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);
      renderer.resize(width, 150);
      const context = renderer.getContext();


      const stave = new VF.Stave(10, 40, 800);
      stave.addClef('treble').setContext(context).draw();
      console.log(this.score())

      const vexNotes = this.score()!.map((note, index) => {
        const pitch = note[0].toLowerCase();       // ex: 'G' -> 'g'
        const accidental = note[1] === '#' || note[1] === 'b' ? note[1] : '';
        const octave = accidental ? note[2] : note[1];
        const key = `${pitch}${accidental}/${octave}`;  // ex: g#/4 sau g/4

        const newNote = new VF.StaveNote({
          clef: 'treble',
          keys: [key],
          duration: this.duration()![index]
        })

        if (note[3] === '#') {
          newNote.addModifier(new VF.Accidental('#'), 0);
        } else if (note[3] === 'b') {
          newNote.addModifier(new VF.Accidental('b'), 0);
        }

        return newNote;
      }
      );


      const voice = new VF.Voice({
        numBeats: vexNotes.length,
        beatValue: 4
      });
      voice.setStrict(false);
      voice.addTickables(vexNotes);

      new VF.Formatter().joinVoices([voice]).format([voice], stave.getWidth() - 20);
      voice.draw(context, stave);
    }
  }
}
