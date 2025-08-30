import { Component, inject } from '@angular/core';
import { LoginComponent } from '../login/login.component';
import { Router } from '@angular/router';
import { AuthService } from '../shared/service/authService';
@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [LoginComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent {
  isLogin: boolean = false;
  router=inject(Router)
  isUserAlreadyLoggedIn=false
  authService=inject(AuthService)
  ngOnInit(): void {
    let userInfo=this.authService.getUserInfoFromToken();
    if(userInfo)
      this.isUserAlreadyLoggedIn=true
    if (this.isUserAlreadyLoggedIn) {
      this.router.navigate(['/invata']); 
    }
  }

  showLogin() {
    this.isLogin = true;
  }

  signup()
  {
    this.router.navigate(['/inregistrare'])
  }


}
