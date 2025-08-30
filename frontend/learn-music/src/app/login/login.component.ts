import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../shared/service/authService';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  @Output() closeLogin = new EventEmitter<void>();

  email: string = '';
  password: string = '';
  errorMessage = '';

  router = inject(Router);
  authService = inject(AuthService)

  close() {
    this.closeLogin.emit();
  }

  onSubmit(form: NgForm) {
    this.email = form.value.email;
    this.password = form.value.password;

    console.log(this.email,this.password)
    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        this.router.navigate(['/invata']);
      },
      error: (err) => {
        
        this.errorMessage = err.message; 
        console.error('Eroare login:', err.message); 
      }
    });
  }
}
