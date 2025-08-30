import { Component, ViewChild, ElementRef,output, input,effect } from '@angular/core';
import { VexFlow } from 'vexflow';
import { Note } from '../../models/note';

import { AccidentSelectorComponent } from "./accident-selector/accident-selector.component";

@Component({
  selector: 'app-write-score',
  standalone: true,
  imports: [AccidentSelectorComponent],
  templateUrl: './write-score.component.html',
  styleUrl: './write-score.component.scss'
})
export class WriteScoreComponent {

  @ViewChild('scoreContainer', { static: true }) scoreContainer!: ElementRef;

  notes = [
    { type: 'quarter', basePitch: 'C4', symbol: '♩', name: 'pătrime' },
    { type: 'half', basePitch: 'C4', symbol: '𝅗𝅥', name: 'doime' },
    { type: 'whole', basePitch: 'C4', symbol: '𝅝', name: 'nota întreagă' },
    { type: 'qr', basePitch: 'b/4', symbol: '𝄽', name: 'pauză de pătrime' },
    { type: 'wr', basePitch: 'a/4', symbol: '𝄻', name: 'pauză 2 timpi/întreagă' },
    { type: 'eighth', basePitch: 'C4', symbol: '♪', name: 'optime' },
    { type: 'eighthDot', basePitch: 'C4', symbol: '♪.', name: 'optime cu punct' },
    { type: 'quarterDot', basePitch: 'C4', symbol: '♩.', name: 'pătrime cu punct' } ,
  ];


  selectedSymbol: any = this.notes[0];
  vf: any;
  stave: any;
  voice: any;
  notesArray: Note[]=[];
  notesDrawn: any[] = [];
  beams: any[] = [];
  accident:string='#';
  showQuestion=false
  isAccidentSelected=false
  hoverNote: string | null = null;

  resetScore=input(false)
  notesChosen=output<Note[]>()

  constructor() {
    effect(() => {
      if (this.resetScore() === true) {
        this.clearAll();
      }
    });
  }


  ngAfterViewInit(): void {
    const VF = VexFlow;
    const div = this.scoreContainer.nativeElement;
    const width = div.clientWidth;
    const height = div.clientHeight;

    const renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);
    renderer.resize(width, height);

    const context = renderer.getContext();
    context.setFont('Arial', 10);
    const staveY = height / 10;

    this.stave = new VF.Stave(10, staveY, width - 20);
    this.stave.addClef('treble').setContext(context).draw();

    this.vf = { VF, context };
  }

  onScoreClick(event: MouseEvent): void {
    const svg = this.scoreContainer.nativeElement.querySelector('svg');
    const pt = svg.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

    const clickX = svgP.x;
    const clickY = svgP.y;

    let pitch = 'c/4';
    const staveTop = this.stave.getYForLine(0);
    const staveBottom = this.stave.getYForLine(4);
    const lineSpacing = (staveBottom - staveTop) / 4;
    const lines = ['f/5', 'e/5', 'd/5', 'c/5', 'b/4', 'a/4', 'g/4', 'f/4', 'e/4', 'd/4', 'c/4', 'b/3', 'a/3', 'g/3'];

    const yOffset = clickY - staveTop;
    const lineIndex = Math.round(yOffset / (lineSpacing / 2));

    //console.log(this.selectedSymbol.type)
  
    if (lineIndex >= 0 && lineIndex < lines.length) {
      if (this.selectedSymbol.type!='qr' && this.selectedSymbol.type!='wr')
            pitch = lines[lineIndex];
      else pitch=this.selectedSymbol.basePitch
    }

    const durationMap: any = {
      'quarter': 'q',
      'half': 'h',
      'whole': 'w',
      'eighth': '8',
      'qr': 'qr',
      'wr': 'wr',
      'quarterDot': 'qd',
      'eighthDot': '8d' 
    };

    const duration = durationMap[this.selectedSymbol.type];
    let accidental = 'n';

    if (this.selectedSymbol.type !== 'qr' && this.selectedSymbol.type !== 'wr') {
      this.showQuestion = true;
      this.waitForAccidentSelection().then(() => {
        accidental = this.accident;
        this.addNoteToScore(pitch, duration, accidental);
        this.isAccidentSelected=false
      });
    }
    else{
      accidental = 'n'; 
      this.addNoteToScore(pitch, duration, accidental);
    }
    
  }

  waitForAccidentSelection(): Promise<void> {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (this.isAccidentSelected) {
          clearInterval(interval); 
          resolve();
        }
      }, 100); 
    });
  }

  addNoteToScore(pitch: string, duration: string, accidental: string) {
    this.notesArray.push({
      pitch,
      duration,
      accidental,
      
    });
    let addDot=false;
    const VF = this.vf.VF;
    const context = this.vf.context;
    const notes = this.notesArray.map((noteData) => {
      if(noteData.duration.endsWith('d'))
      {
        addDot=true
        //console.log('Timp schimbat '+noteData.duration)
      }
      const staveNote = new VF.StaveNote({
        clef: 'treble',
        keys: [noteData.pitch],
        duration: noteData.duration,
      });

      if (noteData.accidental === '#') {
        staveNote.addModifier(new VF.Accidental('#'), 0);
      } else if (noteData.accidental === 'b') {
        staveNote.addModifier(new VF.Accidental('b'), 0);
      }
      if(addDot==true)
        staveNote.addModifier( new VexFlow.Dot,0);
      addDot=false
      return staveNote;
    });
    this.notesDrawn.push(notes);
    this.voice = new VF.Voice({ numBeats: 1, beatValue: 4 });
    this.voice.setStrict(false);
    this.voice.addTickables(notes);

    const formatter = new VF.Formatter().joinVoices([this.voice]).format([this.voice], this.stave.getWidth() - 20);
    context.clear();

    this.stave.setContext(context).draw();
    this.voice.draw(context, this.stave);

    this.notesChosen.emit(this.notesArray);
  }

  selectSymbol(symbol: any) {
    this.selectedSymbol = symbol;
    console.log("Am selectat " + symbol.type);
  }

  onAccidentSelected(accidental: string) {
    this.accident = accidental;
    this.isAccidentSelected = true;
    this.showQuestion = false;
  }

  undo() {
  if (this.notesArray.length > 0) {
    this.notesArray.pop();
    this.redrawScore();
  }
}

clearAll() {
  this.notesArray = [];
  this.redrawScore();
}


private redrawScore() {
  const VF = this.vf.VF;
  const context = this.vf.context;

  context.clear();
  this.stave.setContext(context).draw();
  console.log(this.notesArray)
  const notes = this.notesArray.map((noteData) => {
    let addDot=false
     if(noteData.duration.endsWith('d'))
      {
        addDot=true
        console.log('Timp schimbat '+noteData.duration)
      }
    const staveNote = new VF.StaveNote({
      clef: 'treble',
      keys: [noteData.pitch],
      duration: noteData.duration
    });
    if(addDot==true)
        staveNote.addModifier( new VexFlow.Dot,0);
    if (noteData.accidental === '#') {
      staveNote.addModifier(new VF.Accidental('#'), 0);
    } else if (noteData.accidental === 'b') {
      staveNote.addModifier(new VF.Accidental('b'), 0);
    }

    return staveNote;
  });

  if (notes.length > 0) {
    const voice = new VF.Voice({ numBeats: 1, beatValue: 4 });
    voice.setStrict(false);
    voice.addTickables(notes);

    new VF.Formatter().joinVoices([voice]).format([voice], this.stave.getWidth() - 20);
    voice.draw(context, this.stave);
  }

  this.notesChosen.emit(this.notesArray);
}

onMouseMove(event: MouseEvent): void {
  const svg = this.scoreContainer.nativeElement.querySelector('svg');
  if (!svg) return;

  const pt = svg.createSVGPoint();
  pt.x = event.clientX;
  pt.y = event.clientY;
  const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

  const clickY = svgP.y;

  const staveTop = this.stave.getYForLine(0);
  const staveBottom = this.stave.getYForLine(4);
  const lineSpacing = (staveBottom - staveTop) / 4;
  const lines = [
    'f/5', 'e/5', 'd/5', 'c/5', 'b/4', 'a/4', 'g/4',
    'f/4', 'e/4', 'd/4', 'c/4', 'b/3', 'a/3', 'g/3'
  ];

  const solfegeMap: any = {
    'c': 'do', 'd': 're', 'e': 'mi', 'f': 'fa',
    'g': 'sol', 'a': 'la', 'b': 'si'
  };

  const yOffset = clickY - staveTop;
  const lineIndex = Math.round(yOffset / (lineSpacing / 2));

  if (lineIndex >= 0 && lineIndex < lines.length && this.selectedSymbol.type !== 'qr' && this.selectedSymbol.type !== 'wr') {
    const pitch = lines[lineIndex];
    const letter = pitch.charAt(0).toLowerCase();
    this.hoverNote = solfegeMap[letter] || null;
  } else {
    this.hoverNote = null;
  }
}


}

