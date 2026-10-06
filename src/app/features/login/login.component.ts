import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <main class="login-page">
      <section class="login-card">
        <div class="login-brand">
          <div class="login-mark" role="img" aria-label="AUTO SHOP"></div>
          <div>
            <strong>AUTO SHOP</strong>
            <span>Gestion de magasin automobile</span>
          </div>
        </div>

        <div class="login-intro">
          <h1>Bienvenue</h1>
          <p>Connectez-vous pour accéder à votre espace de gestion.</p>
        </div>

        <form (ngSubmit)="submit()" #loginForm="ngForm">
          <label class="form-label" for="username">Nom d'utilisateur</label>
          <div class="input-group mb-3">
            <span class="input-group-text"><i class="bi bi-person"></i></span>
            <input id="username" name="username" class="form-control" [(ngModel)]="username" required autocomplete="username" autofocus>
          </div>

          <label class="form-label" for="password">Mot de passe</label>
          <div class="input-group mb-2">
            <span class="input-group-text"><i class="bi bi-lock"></i></span>
            <input id="password" name="password" class="form-control" [type]="showPassword ? 'text' : 'password'" [(ngModel)]="password" required autocomplete="current-password">
            <button type="button" class="btn btn-outline-secondary" (click)="showPassword = !showPassword" [attr.aria-label]="showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"><i [class]="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i></button>
          </div>

          <div *ngIf="error" class="alert alert-danger py-2 mt-3 mb-3">{{error}}</div>
          <button class="btn btn-primary w-100 login-submit" type="submit" [disabled]="loginForm.invalid || loading">
            <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
            <i *ngIf="!loading" class="bi bi-box-arrow-in-right me-2"></i>
            Se connecter
          </button>
        </form>

        <div class="login-help">
          <i class="bi bi-shield-check"></i>
          <span>Vos données restent stockées localement sur cet ordinateur.</span>
        </div>
      </section>
    </main>
  `
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;
  showPassword = false;

  constructor(private auth: AuthService, private router: Router) {}

  async submit() {
    this.error = '';
    this.loading = true;
    const success = await this.auth.login(this.username.trim(), this.password);
    this.loading = false;
    if (success) {
      await this.router.navigate(['/dashboard']);
    } else {
      this.error = 'Nom d’utilisateur ou mot de passe incorrect.';
    }
  }
}
