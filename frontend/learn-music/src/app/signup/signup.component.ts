import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../shared/service/authService';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  shakeForm = false;

  passwordMismatch = false;
  passwordTooShort = false;
  formSubmitted = false;
  isEmailInvalid = false;
  isFormEmpty = false;  

  authService=inject(AuthService)
  router=inject(Router)
  onSignup() {
    this.formSubmitted = true;
    this.passwordMismatch = this.password !== this.confirmPassword;
    this.passwordTooShort = this.password.length < 8;
    this.isFormEmpty = !this.name || !this.email || !this.password || !this.confirmPassword;
    this.isEmailInvalid = !this.email.includes('@') || !this.email.includes('.');

    if (this.isFormEmpty || this.passwordMismatch || this.passwordTooShort || this.isEmailInvalid) {
      this.triggerShake();
      return;
    }

    if (!this.passwordMismatch && !this.passwordTooShort) {
      console.log("Date valide de înregistrare:", {
        name: this.name,
        email: this.email,
        password: this.password
      });

      this.authService.signup(this.name, this.email, this.password).subscribe(
        (response) => {
          console.log("Înregistrare reușită:", response);
          this.router.navigate(['/invata']);  
        },
        (error) => {
          console.error('Eroare înregistrare:', error);
        }
      );
    }
  }

  triggerShake() {
  this.shakeForm = true;
  setTimeout(() => {
    this.shakeForm = false;
  }, 500);
}
}
