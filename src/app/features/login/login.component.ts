import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../dashboard/services/auth.service';
import { UtilsService } from '../dashboard/services/utils.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  public utilsService = inject(UtilsService);
  public authService = inject(AuthService);

  loginEmail = '';
  loginName = '';
  showNameField = false;

  handleLogin() {
    if (!this.loginEmail.trim()) return;

    const cleanedEmail = this.loginEmail.trim().toLowerCase();
    const usersList = JSON.parse(localStorage.getItem('@readva:users_db') || '[]');
    const existingUser = usersList.find((u: any) => u.email === cleanedEmail);

    if (existingUser) {
      this.authService.authenticate(cleanedEmail, existingUser.name);
    } else if (!this.showNameField) {
      this.showNameField = true;
    } else {
      if (!this.loginName.trim()) return;
      this.authService.authenticate(cleanedEmail, this.loginName);
    }
  }
}
