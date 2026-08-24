import { Component, inject } from '@angular/core';
import type { OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../dashboard/services/auth.service';
import { UtilsService } from '../dashboard/services/utils.service';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  readonly utilsService = inject(UtilsService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  mode: AuthMode = 'login';
  email = '';
  name = '';
  password = '';
  passwordConfirmation = '';
  errorMessage = '';
  isSubmitting = false;

  async ngOnInit(): Promise<void> {
    if (await this.authService.ensureInitialized()) await this.navigateAfterAuthentication();
  }

  setMode(mode: AuthMode): void {
    this.mode = mode;
    this.errorMessage = '';
    this.password = '';
    this.passwordConfirmation = '';
  }

  async handleSubmit(): Promise<void> {
    if (this.isSubmitting) return;
    this.errorMessage = this.validate();
    if (this.errorMessage) return;

    this.isSubmitting = true;
    try {
      if (this.mode === 'register') {
        await this.authService.register(this.name, this.email, this.password);
      } else {
        await this.authService.login(this.email, this.password);
      }
      await this.navigateAfterAuthentication();
    } catch (error) {
      this.errorMessage = error instanceof Error ? error.message : 'Não foi possível entrar.';
    } finally {
      this.isSubmitting = false;
    }
  }

  private validate(): string {
    if (!this.email.trim() || !this.password) return 'Preencha o e-mail e a senha.';
    if (this.password.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.';
    if (this.mode === 'register' && this.name.trim().length < 2) {
      return 'Informe como você quer ser chamado.';
    }
    if (this.mode === 'register' && this.password !== this.passwordConfirmation) {
      return 'As senhas não coincidem.';
    }
    return '';
  }

  private async navigateAfterAuthentication(): Promise<void> {
    const requestedUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const returnUrl =
      requestedUrl?.startsWith('/') && !requestedUrl.startsWith('//') ? requestedUrl : '/';
    await this.router.navigateByUrl(returnUrl);
  }
}
