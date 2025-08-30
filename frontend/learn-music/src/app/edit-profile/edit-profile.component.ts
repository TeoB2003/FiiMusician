import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../shared/service/authService';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.scss'
})
export class EditProfileComponent {
  username: string = '';
  password: string = '';
  showSuccessMessage: boolean = false;
  authService = inject(AuthService)
  private router = inject(Router)
  http=inject(HttpClient);
  auth=inject(AuthService)

  saveChanges() {
    const userId = this.authService.getUserInfoFromToken()?.id;
    if (!userId) {
      console.error("User ID not found in token.");
      return;
    }

    let dataToSend: { username: string; password: string } = {
      username: this.username?.trim() || '',
      password: ''
    };
    if(this.password)
    {
      dataToSend.password=this.auth.hashPassword(this.password)
    }
    this.http.put(`http://localhost:8000/updatedate/${userId}`, dataToSend).subscribe({
      next: (response) => {
        this.showSuccessMessage = true;
        setTimeout(() => {
          this.router.navigate(['/invata']);
        }, 1000);
      },
      error: (error) => {
        console.error("Eroare la actualizarea datelor:", error);
        // Poți adăuga și un mesaj vizual pentru utilizator
      }
    });
  }

  goBack() {
    this.router.navigate(['/invata']);
  }
}
