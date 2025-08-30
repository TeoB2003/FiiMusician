import { NgClass, NgStyle } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { WriteAnswerExerciseComponent } from "../write-answer-exercise/write-answer-exercise.component";
import { ChooseAnswerExerciseComponent } from "../choose-answer-exercise/choose-answer-exercise.component";
import { FeedbackComponent } from '../shared/compononents/feedback/feedback.component';
import { AuthService } from '../shared/service/authService';
import { SubchaptersComponent } from './subchapters/subchapters.component';
import { ChapterService } from './chaptersService';
import { Content, ContentService } from '../shared/service/contentService';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TheoryComponent } from "./theory/theory.component";
import { ChapterTestComponent } from './chapter-test/chapter-test.component';
import { ProgressService } from '../shared/service/progressService';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UnresolvedExerciseComponent} from './unresolved-exercise/unresolved-exercise.component'

@Component({
  selector: 'app-main-panel',
  standalone: true,
  imports: [NgStyle, WriteAnswerExerciseComponent, ChooseAnswerExerciseComponent, FeedbackComponent, SubchaptersComponent, TheoryComponent, ChapterTestComponent, UnresolvedExerciseComponent],
  templateUrl: './main-panel.component.html',
  styleUrl: './main-panel.component.scss'
})
export class MainPanelComponent {
  percent: number = 80;
  contentHtml = ""

  title = ''
  expandedChapters: boolean[] = [];
  chapters: { title: string; subchapters: string[] }[] = [];
  ordineSubcapitol = 0

  answer = ""
  content: Content

  showTheory: boolean = false
  showTest: boolean = false
  showFeedback: boolean = false;
  showExercise:boolean=false

  feedbackMessage: string = '';
  feedbackClass: string = '';
  isLoading = false
  userLevel = "incepator"

  name: string | undefined;
  userId = 0


  safeHtml!: SafeHtml;

  theoryChapter = ""
  theorySubChapter = ""

  private sanitizer = inject(DomSanitizer);
  private router = inject(Router)
  private authService = inject(AuthService)
  private chapterService = inject(ChapterService);
  private contentService = inject(ContentService);
  private progressService = inject(ProgressService);
  private http = inject(HttpClient)

  constructor() {
    this.name = this.authService.getUserInfoFromToken()?.username
    let user = this.authService.getUserInfoFromToken()?.id
    if (user != undefined)
      {
        this.userId = user
        console.log(this.userId)
      }
    else{
      console.log("User undefined")
    }
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

  ngOnInit(): void {
    this.chapterService.getChapters().subscribe((data) => {
      this.chapters = data.map((title) => ({
        title,
        subchapters: []
      }));
      console.log(this.chapters)
      this.expandedChapters = new Array(this.chapters.length).fill(false);
    });


    this.contentService.getNextContent(this.userId).subscribe(
      (contentData: Content) => {
        this.content = contentData;
        localStorage.setItem('userProgress', JSON.stringify({
          lastEx: this.content.id,
          userId: this.userId
        }));
        this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(this.content.text);
        //console.log(contentData)
        //console.log(this.chapters)
        console.log(this.content.id_subcapitol)
        this.setPercent(this.content.id_capitol, this.content.id_subcapitol)
        this.title = this.chapters[this.content.id_capitol - 1]?.title || 'Titlu indisponibil';
      },
      (error) => {
        console.error('Eroare la încărcarea conținutului:', error);
      }
    );
  }

  getColor(percent: number): string {
    if (percent > 80) {
      return '#3b9e4f';
    } else if (percent >= 50 && percent <= 80) {
      return '#f4c542';
    } else {
      return '#e74c3c';
    }
  }

  toggleChapter(index: number, isToggle: boolean = true) {

    if (this.chapters[index].subchapters.length === 0) {
      this.chapterService.getSubchapters(this.chapters[index].title).subscribe((subchapters) => {
        this.chapters[index].subchapters = subchapters;
      });
    }

    if (isToggle == true)
      this.expandedChapters[index] = !this.expandedChapters[index];
  }

  goToEarTrain() {
    this.router.navigate(['/auz']);
  }

  handleChosenAnswer(answer: string) {
    this.answer = answer
  }

  printAnswer() {
    //console.log(this.answer)

    if (this.content.is_theory == false) {
      this.showFeedback = true
      this.isLoading = true
    }

    let correct = this.answer == this.content.raspuns_corect
    if (correct) {
      this.feedbackMessage = "Raspuns corect"
      this.feedbackClass = "correct"
    }
    else {
      this.feedbackMessage = "Raspuns gresit"
      this.feedbackClass = "incorrect"
    }

    if (this.content.is_theory == true) {
      this.showFeedback = true
      this.feedbackClass = "info"
      this.feedbackMessage = "Se încarcă"

    }
    if (this.content.is_theory == false) {
      console.log("Trimit progres!")
      let isCorrect = correct == true ? 1 : 2
      this.progressService.sendResultEx(this.content.id_capitol, this.content.id, isCorrect,this.userId).subscribe(
        {
          next:(response)=>{
            console.log(response)
          }
        }
      )
    }

    const startTime = Date.now();
    this.contentService.getNextContent(this.userId).subscribe({
      next: (contentData: Content) => {
        const elapsed = Date.now() - startTime;
        const delay = Math.max(1000 - elapsed, 0);

        setTimeout(() => {
          this.content = contentData;
          console.log(this.content)
          //console.log(this.content.note?.note)
          this.setPercent(this.content.id_capitol, this.content.id_subcapitol)
          this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(this.content.text);
          this.showFeedback = false;
          this.isLoading = false;
          this.answer = "";
        }, delay);
      },
      error: (error) => {
        console.error("Eroare la încărcarea conținutului:", error);
        this.showFeedback = false;
        this.isLoading = false;
      }
    });

    localStorage.setItem('userProgress', JSON.stringify({
      lastEx: this.content.id,
      userId: this.userId
    }));
  }

  computePercent(idCapitol: number, idSubcapitol: number, numberOfSubChapters: number) {
    this.chapterService.getIndexOfSubchapter(idCapitol, idSubcapitol).subscribe(index => {
      const parsedIndex = Number(index);
      this.ordineSubcapitol = parsedIndex;
      this.percent = Math.ceil((parsedIndex / numberOfSubChapters) * 100);
      console.log(`Indexul este ${parsedIndex}, nr total: ${numberOfSubChapters}, procentul: ${this.percent}`);
    });
  }

  setPercent(idCapitol: number, idSubcapitol: number) {
    const chapterIndex = idCapitol - 1;

    if (this.chapters[chapterIndex].subchapters.length === 0) {
      this.chapterService.getSubchapters(this.chapters[chapterIndex].title).subscribe(subchapters => {
        this.chapters[chapterIndex].subchapters = subchapters;

        this.computePercent(idCapitol, idSubcapitol, subchapters.length);
      });
    } else {
      const numberOfSubChapters = this.chapters[chapterIndex].subchapters.length;
      this.computePercent(idCapitol, idSubcapitol, numberOfSubChapters);
    }
  }


  logout() {
    const saved = localStorage.getItem('userProgress');
    console.log("Log out!!")
    //trimit progres
    if (saved) {
      try {
        const progress = JSON.parse(saved);
        if (progress && typeof progress === 'object') {
          const headers = new HttpHeaders({
            'Content-Type': 'application/json'
          });

          this.http.post('http://localhost:8000/save-progress', progress, { headers }).subscribe({
            next: () => {
              console.log('Progres salvat în backend');
              localStorage.removeItem('userProgress');
              this.authService.logout()
              this.router.navigate(['/'])
            },
            error: (err) => {
              console.error('Eroare la salvarea progresului:', err);
              this.authService.logout()
              this.router.navigate(['/'])
            }
          });
        }
      } catch (e) {
        console.error('Date corupte în localStorage:', e);
      }
    }
    else {
      console.log("Not found storage")
      this.authService.logout()
      this.router.navigate(['/'])
    }
  }

  openTheory(chaperName: string, subchapterName: string) {
    this.theoryChapter = chaperName
    this.theorySubChapter = subchapterName
    console.log(this.theoryChapter)
    this.showTheory = true
  }

  openTest() {
    this.showTest = true;
  }
  closeTest(shouldRefresh: boolean) {
    this.showTest = false
    if (shouldRefresh == true) {
      const startTime = Date.now();
      this.contentService.getNextContent(this.userId).subscribe({
        next: (contentData: Content) => {
          const elapsed = Date.now() - startTime;
          const delay = Math.max(1000 - elapsed, 0);

          setTimeout(() => {
            this.content = contentData;
            console.log(this.content)
            console.log(this.content.note?.note)
            this.setPercent(this.content.id_capitol, this.content.id_subcapitol)
            this.safeHtml = this.sanitizer.bypassSecurityTrustHtml(this.content.text);
            this.showFeedback = false;
            this.isLoading = false;
            this.answer = "";
          }, delay);
        },
        error: (error) => {
          console.error("Eroare la încărcarea conținutului:", error);
          this.showFeedback = false;
          this.isLoading = false;
        }
      });
    }

  }

  closeTheory() {
    this.showTheory = false
  }

  closeExercise()
  {
    this.showExercise=false
  }

  openExercise()
  {
    this.showExercise=true
  }
  goToEditProfile() {
    this.router.navigate(['/edit-profile'])
  }
}
