import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import * as Tone from 'tone';
import { WriteScoreComponent } from "../shared/compononents/write-score/write-score.component";
import { Note } from '../shared/models/note';
import { CommonModule } from '@angular/common';
import { FeedbackComponent } from '../shared/compononents/feedback/feedback.component';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../shared/service/authService';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-ear-train',
  standalone: true,
  imports: [WriteScoreComponent, CommonModule, FeedbackComponent],
  templateUrl: './ear-train.component.html',
  styleUrl: './ear-train.component.scss'
})
export class EarTrainComponent {
  exerciseType: 'ear-training' | 'perfect-intonation' = 'ear-training';
  wasPressed = false;
  isSinging = false;
  hasOption = true
  sounds = [
    { note: "C4", duration: "4n" },
    { note: "E4", duration: "8n" },
    { note: "G4", duration: "8n" },
  ];
  note_ord = [
    "C4", "C#4", "D4", "D#4", "E4",
    "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4",
    "C5", "C#5", "D5", "D#5", "E5", "F5", "F#5", "G5", "G#5", "A5", "A#5", "B5"
  ];


  userId = 0
  manualAnswer: string = '';
  currentTime: number = 0;
  totalTime: number = 0;
  interval: any;

  showFeedback: boolean = false;
  feedbackMessage: string = '';
  feedbackClass: string = '';
  isLoading = false
  shouldPlayA = true
  shouldReset = false

  router = inject(Router)
  http = inject(HttpClient)
  auth = inject(AuthService)

  scoreNotes: Note[] = [];


  exercitiu: {
    tip_exercitiu: 'ear-training' | 'perfect-intonation';
    note: Note[];
    variante_raspuns: string[];
  } | null = null;
  varianteAuzAbsolut: string[] = []
  correctAnswer = ''
  currentAnswer = ''

  ngOnInit(): void {
    let user = this.auth.getUserInfoFromToken()?.id
    if (user != null) {
      this.userId = user
      console.log(user)
    }
    console.log(this.userId)
    this.loadEarExercise(this.userId);
  }

  loadEarExercise(userId: number) {
    this.http.get<any>(`http://localhost:8000/earExercise/${userId}`).subscribe({
      next: (data) => {
        console.log("Date primite:", data);
        this.exercitiu = data;
        this.exerciseType = this.exercitiu!.tip_exercitiu
        if (this.exerciseType == "perfect-intonation") {
          this.correctAnswer = this.exercitiu!.variante_raspuns[0]
          this.varianteAuzAbsolut = [...this.exercitiu!.variante_raspuns].sort(() => Math.random() - 0.5);
        }

        //this.sounds = data.note;
      },
      error: (err) => {
        console.error("Eroare la încărcarea exercițiului:", err);
      }
    });
  }

  chooseAnswer(answer: string) {
    this.currentAnswer = answer
  }
  playPerfectIntonation() {
    console.log('Redă sunet de intonație perfectă cu tone.js');
    this.playExercise(false);
  }

  createInitialScoreJson() {
    const obj: {
      auz: { [key: string]: string },
      scris: { [key: string]: string }
    } = {
      auz: {},
      scris: {}
    };

    for (let i = 0; i <= 15; i++) {
      obj.auz[i.toString()] = "0/0";
      obj.scris[i.toString()] = "0/0";
    }

    return obj;
  }

  createInitialRithmJson() {
    const durations = ["1", "2", "4", "8", "16", "32", "1.", "2.", "4.", "8.", "16."];
    const obj: {
      auz: { [key: string]: string },
      scris: { [key: string]: string }
    } = {
      auz: {},
      scris: {}
    };

    for (const dur of durations) {
      obj.auz[dur] = "0/0";
      obj.scris[dur] = "0/0";
    }

    return obj;
  }


  goBack() {
    this.stopPlayback();
    this.router.navigate(['/invata'])
  }

  synth: Tone.Synth | null = null;


  async playMetronome() {
    const metronome = new Tone.MembraneSynth().toDestination();

    const quarterNoteMs = (60 / Tone.Transport.bpm.value) * 1000;
    if (this.shouldPlayA) {
      const noteSynth = new Tone.Synth().toDestination(); +
        noteSynth.triggerAttackRelease("A4", "2n");
      await this.delay(quarterNoteMs * 4);
      noteSynth.dispose();
    }


    for (let i = 0; i < 3; i++) {
      metronome.triggerAttackRelease("C2", "8n");
      await this.delay(quarterNoteMs);
    }
  }

  async playExercise(metronome = true) {
    if (this.isSinging) return;

    this.isSinging = true;
    console.log(this.varianteAuzAbsolut)
    await Tone.start();
    Tone.Transport.stop();
    Tone.Transport.cancel();

    Tone.Transport.bpm.value = 90;
    if (metronome == true)
      await this.playMetronome();
    else {
      console.log("Not Play Metronome")
      console.log("Lungime " + this.exercitiu!.note.length)
      this.sounds = this.convertFromVexFormat(Array.isArray(this.exercitiu!.note) ? this.exercitiu!.note : [this.exercitiu!.note])
    }

    if (!this.synth) {
      this.synth = new Tone.Synth().toDestination();
    }

    type SoundNote = { note: string; duration: string };
    if (this.exercitiu?.note != null && metronome == true) {
      console.log(this.exercitiu.note)
      this.sounds = this.convertFromVexFormat(this.exercitiu.note)
      console.log(this.sounds)
    }

    let accumulatedTime = 0;
    const events: [number, SoundNote][] = this.sounds.map((sound) => {
      const time = accumulatedTime;
      accumulatedTime += Tone.Time(sound.duration).toSeconds();
      return [time, sound];
    });

    const part = new Tone.Part(
      (time: number, value: any) => {
        const note = value as SoundNote;
        if (value.note != 'pauza') {
          this.synth!.triggerAttackRelease(note.note, note.duration, time);
        }
      },
      events as any
    );

    part.start(0);
    Tone.Transport.start("+0.1");

    this.totalTime = this.sounds.reduce((acc, s) => {
      return acc + Tone.Time(s.duration).toSeconds();
    }, 0);

    this.currentTime = 0;
    const intervalMs = 100;

    this.interval = setInterval(() => {
      this.currentTime += intervalMs / 1000;
      if (this.currentTime >= this.totalTime) {
        clearInterval(this.interval);
        this.isSinging = false;
        part.dispose();
      }
    }, intervalMs);
  }




  stopPlayback() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    if (this.synth) {
      this.synth.disconnect();
      this.synth = null;
    }

    Tone.Transport.stop();
    Tone.Transport.cancel();
    this.isSinging = false;
    this.currentTime = 0;
  }

  delay(ms: number) {
    return new Promise(res => setTimeout(res, ms));
  }

  showNotes(event: Note[]) {
    this.scoreNotes = event
  }


  printAnswer() {
    const startTime = Date.now();
    if (this.exerciseType == 'ear-training') {
      const durataInverseMapare: { [key: string]: string } = {
        "1n": "1",
        "2n": "2",
        "4n": "4",
        "8n": "8",
        "4n.": "4.",
        "8n.": "8."
      };

      this.showFeedback = true

      let soundsFromScore = this.convertFromVexFormat(this.scoreNotes);
      let correct = this.compareSounds(soundsFromScore, this.sounds)

      if (correct) {
        this.feedbackMessage = "Raspuns corect"
        this.feedbackClass = "correct"
      }
      else {
        this.feedbackMessage = "Raspuns gresit"
        this.feedbackClass = "incorrect"
      }
      //initializare
      let firstNoteUSer = "A4";
      let firstNoteMusic = "A4";
      let responseInt = this.createInitialScoreJson();
      let responseRitm = this.createInitialRithmJson();

      console.log(this.sounds.length)
      console.log("notele sunt "+ this.sounds)
      for (let i = 0; i < this.sounds.length; i++) {
        let intervalUser = -100
        let ritmUser=''
        if (i < soundsFromScore.length) {
          let nota_utilizator = soundsFromScore[i]
          let notaUser = ''
          ///nu am pus pauze in ritm
          ritmUser=nota_utilizator.duration
          if (nota_utilizator.note == 'pauza' || this.sounds[i].note == 'pauza') {
            continue; //aici ar trebui analizat ritmul cand voi pune pauze
          }


          const enharmonics: { [key: string]: string } = {
            "Bb": "A#",
            "Db": "C#",
            "Eb": "D#",
            "Gb": "F#",
            "Ab": "G#"
          };

          if (enharmonics[nota_utilizator.note]) {
            notaUser = enharmonics[nota_utilizator.note];
          }
          else notaUser = nota_utilizator.note

          intervalUser = this.getSemitoneInterval(firstNoteUSer, notaUser)
          firstNoteUSer = nota_utilizator.note
        }
        //aici pun plus 1 la ritm doar la obiect
        let notaMuzica = this.sounds[i]
        let intervalReal = this.getSemitoneInterval(firstNoteMusic, notaMuzica.note)
        console.log("INtervalul pentru "+ notaMuzica.note+" este "+intervalReal)
        const key = intervalReal.toString();
        const keyRitm = durataInverseMapare[notaMuzica.duration];

        //actualizare intervale
        let [corecte, total] = responseInt.auz[key].split('/').map(Number);
        total += 1;
        if (intervalUser == intervalReal) corecte += 1;
        responseInt.auz[key] = `${corecte}/${total}`;
        /*console.log(notaMuzica.duration)
        console.log(responseRitm);
        console.log(keyRitm);*/
        [corecte, total] = responseRitm.auz[keyRitm].split('/').map(Number);
        //actualizare ritm 
        console.log("Ritm pentru "+ notaMuzica.note+ "este "+ keyRitm+' '+notaMuzica.duration);
        if(ritmUser in durataInverseMapare )
        {
          console.log(ritmUser)
           if (ritmUser==notaMuzica.duration)
            corecte+=1
        }
        total+=1
        responseRitm.auz[keyRitm]=`${corecte}/${total}`

        firstNoteMusic = this.sounds[i].note
      }
      const responseObj = { recunoastere_intervale: responseInt, recunoastere_ritm: responseRitm };
      console.log("Noul obiect este")
      console.log(responseObj)

      this.http.put<any>(`http://localhost:8000/progres/${this.userId}/recunoastere-intervale`, responseObj).subscribe({
        next: (response) => {
          console.log("Update progres trimis cu succes:", response);
          // Acum pot încărca noul exercițiu
          this.loadEarExercise(this.userId)
          this.totalTime = 0;
          this.currentTime = 0;
          this.isSinging = false;
          this.shouldReset = true
          setTimeout(() => {
            this.showFeedback = false;
            this.shouldReset = false;
          }, 1000);
        },
        error: (err) => {
          console.error("Eroare la trimiterea progresului:", err);
          this.loadEarExercise(this.userId)
          this.totalTime = 0;
          this.currentTime = 0;
          this.isSinging = false;
          this.shouldReset = true
          setTimeout(() => {
            this.showFeedback = false;
            this.shouldReset = false;
          }, 1000);
        }
      });

    }

    else {
      let correct = this.currentAnswer == this.correctAnswer;
      console.log("Correct =" + correct)
      if (correct) {
        this.feedbackMessage = "Raspuns corect";
        this.feedbackClass = "correct";
      } else {
        this.feedbackMessage = "Raspuns gresit";
        this.feedbackClass = "incorrect";
      }
      let number = correct == true ? 1 : 2;
      console.log(number)
      const note = encodeURIComponent(this.correctAnswer);
      this.http.get<any>(`http://localhost:8000/absolutePitch/${this.userId}/${note}/${number}`).subscribe({
        next: () => {
          this.loadEarExercise(this.userId);
          this.totalTime = 0;
          this.currentTime = 0;
          this.currentAnswer = '';
          this.correctAnswer = ''
          this.isSinging = false;
          this.shouldReset = true;
          this.showFeedback = true;

          setTimeout(() => {
            this.showFeedback = false;
            this.shouldReset = false;
          }, 1000);
        },
        error: (err) => {
          console.error("Eroare la salvarea progresului:", err);
          this.loadEarExercise(this.userId);
          this.totalTime = 0;
          this.currentTime = 0;
          this.currentAnswer = '';
          this.correctAnswer = ''
          this.isSinging = false;
          this.shouldReset = true;
          this.showFeedback = true;

          setTimeout(() => {
            this.showFeedback = false;
            this.shouldReset = false;
          }, 1000);
        }
      });
    }

  }

  convertFromVexFormat(noteArray: Note[]) {
    //console.log(noteArray)
    console.log(noteArray.length)

    let durationMap = new Map<string, string>([
      ['q', '4n'],
      ['h', '2n'],
      ['w', '1n'],
      ['qr', '4n'],
      ['wr', '1n'],
      ['8', '8n'],
      ['8d', '8n.'],
      ['qd', '4n.']
    ]);
    let sounds: { note: string, duration: string }[] = [];

    for (let i = 0; i < noteArray.length; i++) {
      const nota = noteArray[i];
      const duration = durationMap.get(nota.duration) || '4n';
      console.log(nota.duration)
      if (nota.duration === 'qr' || nota.duration === 'wr') {
        sounds.push({
          note: 'pauza',
          duration: duration
        });
        continue;
      }

      const [step, octave] = nota.pitch.split('/');
      //console.log(step)
      //console.log(duration)

      const accidental = nota.accidental !== 'n' ? nota.accidental : '';
      const pitch = step.toUpperCase() + accidental + octave;
      //console.log("I am here " + pitch)
      sounds.push({
        note: pitch,
        duration: duration
      });
    }
    return sounds;
  }

  compareSounds(expected: { note: string, duration: string }[], actual: { note: string, duration: string }[]): boolean {
    if (expected.length !== actual.length) return false;

    for (let i = 0; i < expected.length; i++) {
      const e = expected[i];
      const a = actual[i];
      if (e.note !== a.note || e.duration !== a.duration) {
        console.log("Prima greseala e la nota "+a.note+ " "+a.duration);
        return false;
      }
    }

    return true;
  }


  getSemitoneInterval(note1: string, note2: string) {

    const i1 = this.note_ord.indexOf(note1);
    const i2 = this.note_ord.indexOf(note2);

    if (i1 === -1 || i2 === -1) {
      throw new Error("Notele nu sunt recunoscute: " + note1 + " / " + note2);
    }

    return Math.abs(i2 - i1);
  }

}
