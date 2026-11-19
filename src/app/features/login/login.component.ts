import { Component, inject } from '@angular/core';
import type { OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../dashboard/services/auth.service';
import { UtilsService } from '../dashboard/services/utils.service';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

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
  feedbackMessage = '';
  isSubmitting = false;
  resetToken = '';
  resetRequestSent = false;

  async ngOnInit(): Promise<void> {
    const resetFragment = this.route.snapshot.fragment ?? '';
    const fragmentToken = resetFragment.startsWith('resetToken=')
      ? resetFragment.slice('resetToken='.length)
      : '';
    this.resetToken =
      fragmentToken || this.route.snapshot.queryParamMap.get('resetToken') || '';
    if (this.resetToken) {
      this.mode = 'reset';
      return;
    }
    if (await this.authService.ensureInitialized()) await this.navigateAfterAuthentication();
  }

  setMode(mode: 'login' | 'register' | 'forgot'): void {
    this.mode = mode;
    this.errorMessage = '';
    this.feedbackMessage = '';
    this.password = '';
    this.passwordConfirmation = '';
    this.resetRequestSent = false;
  }

  async handleSubmit(): Promise<void> {
    if (this.isSubmitting) return;
    this.errorMessage = '';
    this.feedbackMessage = '';
    this.errorMessage = this.validate();
    if (this.errorMessage) return;

    this.isSubmitting = true;
    try {
      if (this.mode === 'forgot') {
        await this.authService.requestPasswordReset(this.email);
        this.resetRequestSent = true;
        this.feedbackMessage =
          'Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha.';
      } else if (this.mode === 'reset') {
        await this.authService.confirmPasswordReset(this.resetToken, this.password);
        this.mode = 'login';
        this.resetToken = '';
        this.password = '';
        this.passwordConfirmation = '';
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { resetToken: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
        this.feedbackMessage = 'Senha atualizada! Entre com sua nova senha.';
      } else if (this.mode === 'register') {
        await this.authService.register(this.name, this.email, this.password);
      } else {
        await this.authService.login(this.email, this.password);
      }
      if (this.mode === 'login' || this.mode === 'register') {
        if (!this.feedbackMessage) await this.navigateAfterAuthentication();
      }
    } catch (error) {
      this.errorMessage = this.getAuthErrorMessage(error);
    } finally {
      this.isSubmitting = false;
    }
  }

  private validate(): string {
    if (this.mode === 'forgot') {
      if (!this.email.trim()) return 'Informe seu e-mail para receber o link de recuperação.';
      if (!this.isValidEmail(this.email)) return 'Informe um e-mail válido.';
      return '';
    }
    if (this.mode !== 'reset' && !this.email.trim()) return 'Preencha o e-mail.';
    if (this.mode !== 'reset' && !this.isValidEmail(this.email)) return 'Informe um e-mail válido.';
    if (this.mode === 'reset' && !this.resetToken) return 'Este link de recuperação não é válido.';
    if (!this.password) return 'Preencha a senha.';
    if (this.password.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.';
    if (this.mode === 'register' && this.name.trim().length < 2) {
      return 'Informe como você quer ser chamado.';
    }
    if ((this.mode === 'register' || this.mode === 'reset') && this.password !== this.passwordConfirmation) {
      return 'As senhas não coincidem.';
    }
    return '';
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  private getAuthErrorMessage(error: unknown): string {
    const message = error instanceof Error ? error.message : '';
    if (message.includes("Unexpected token '<'") || message.includes('<!doctype')) {
      return 'Não consegui falar com a API. Inicie o backend na porta 8080 e reinicie o frontend para atualizar o proxy.';
    }
    return message || 'Não foi possível entrar.';
  }

  private async navigateAfterAuthentication(): Promise<void> {
    const requestedUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    const returnUrl =
      requestedUrl?.startsWith('/') && !requestedUrl.startsWith('//') ? requestedUrl : '/';
    await this.router.navigateByUrl(returnUrl);
  }
}
