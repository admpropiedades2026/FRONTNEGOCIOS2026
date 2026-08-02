import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@/app/core/services/auth.service';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/app/firebase-config';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="antialiased min-h-screen relative flex flex-col justify-center items-center font-body-md text-body-md text-on-surface">

  <!-- Background Image Layer -->
  <div class="fixed inset-0 z-0">
    <div class="absolute inset-0 bg-cover bg-center blur-sm scale-105" style="background-image: url('layout/images/LobbyCoba223.jpg');"></div>
    <div class="absolute inset-0 bg-gray-500/30"></div>
  </div>

  <!-- Main Content Canvas -->
  <main class="relative z-10 w-full px-6 md:px-0 flex flex-col justify-center items-center" style="min-height: 100vh;">

    <!-- Login Card -->
    <div class="w-full max-w-[440px] bg-surface/90 backdrop-blur-md rounded-xl p-10 shadow-[0px_20px_50px_rgba(0,0,0,0.15)] flex flex-col gap-6">

      <!-- Title -->
      <h1 class="font-headline-lg text-headline-lg text-on-surface text-center">Administración De Negocios</h1>

      <!-- LOGIN VIEW -->
      <ng-container *ngIf="!showForgotForm">
        <form class="flex flex-col gap-6" (ngSubmit)="login()">

          <!-- Error Alert -->
          <div *ngIf="loginError" class="bg-error-container border border-error/20 text-on-error-container text-body-sm p-4 rounded-lg flex items-center gap-2 animate-fade-in">
            <span class="material-symbols-outlined" style="font-size: 18px;">error</span>
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Input: Usuario -->
          <div class="flex flex-col gap-2">
            <label class="text-on-surface font-semibold text-sm tracking-wide" for="username">Usuario</label>
            <input
              [(ngModel)]="email"
              name="email"
              class="bg-transparent border border-outline-variant focus:border-secondary focus:ring-2 focus:ring-secondary/20 rounded px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant/50 transition-colors outline-none"
              id="username"
              placeholder="Ingresa tu usuario"
              type="text"
              required/>
          </div>

          <!-- Input: Contraseña -->
          <div class="flex flex-col gap-2">
            <label class="text-on-surface font-semibold text-sm tracking-wide" for="password">Contraseña</label>
            <div class="relative flex items-center">
              <input
                [(ngModel)]="password"
                name="password"
                class="w-full bg-transparent border border-outline-variant focus:border-secondary focus:ring-2 focus:ring-secondary/20 rounded px-4 pr-11 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant/50 transition-colors outline-none"
                id="password"
                placeholder="Ingresa tu contraseña"
                [type]="showPassword ? 'text' : 'password'"
                required/>
              <button
                class="absolute right-3 flex items-center text-outline-variant hover:text-on-surface transition-colors cursor-pointer"
                type="button"
                tabindex="-1"
                (click)="togglePasswordVisibility()">
                <span class="material-symbols-outlined" style="font-size: 20px;">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
              </button>
            </div>
          </div>

          <!-- Remember & Forgot -->
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-2">
              <input
                class="w-4 h-4 border-outline-variant text-secondary rounded-sm focus:ring-secondary bg-transparent cursor-pointer accent-secondary"
                id="remember"
                type="checkbox"
                [(ngModel)]="rememberMe"
                name="remember"/>
              <label class="text-xs font-medium text-on-surface-variant cursor-pointer" for="remember">Recordar</label>
            </div>
            <a
              (click)="toggleForgotForm(true)"
              class="text-xs font-medium text-secondary hover:text-primary transition-colors underline-offset-2 hover:underline cursor-pointer">
              Olvidé mi contraseña
            </a>
          </div>

          <!-- Submit Button -->
          <button
            class="w-full bg-secondary text-on-secondary rounded py-4 mt-2 font-semibold text-sm tracking-wider hover:opacity-90 active:scale-[0.98] transition-all flex justify-center items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            [disabled]="isLoading">
            <span *ngIf="!isLoading">Iniciar Sesión</span>
            <span *ngIf="isLoading">Iniciando sesión...</span>
            <span class="material-symbols-outlined animate-spin" style="font-size: 18px;" *ngIf="isLoading">sync</span>
            <span class="material-symbols-outlined" style="font-size: 18px;" *ngIf="!isLoading">arrow_forward</span>
          </button>

        </form>
      </ng-container>

      <!-- FORGOT PASSWORD VIEW -->
      <ng-container *ngIf="showForgotForm">
        <form class="flex flex-col gap-6" (ngSubmit)="sendRecoveryEmail()">

          <!-- Success Alert -->
          <div *ngIf="recoverySuccess" class="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-body-sm p-4 rounded-lg flex items-center gap-2 animate-fade-in">
            <span class="material-symbols-outlined" style="font-size: 18px;">check_circle</span>
            <span>Correo de recuperación enviado con éxito.</span>
          </div>

          <!-- Error Alert -->
          <div *ngIf="loginError" class="bg-error-container border border-error/20 text-on-error-container text-body-sm p-4 rounded-lg flex items-center gap-2 animate-fade-in">
            <span class="material-symbols-outlined" style="font-size: 18px;">error</span>
            <span>{{ errorMessage }}</span>
          </div>

          <p class="text-sm text-on-surface-variant">
            Le enviaremos un correo electrónico con instrucciones para restablecer su contraseña.
          </p>

          <!-- Input: Correo -->
          <div class="flex flex-col gap-2">
            <label class="text-on-surface font-semibold text-sm tracking-wide" for="recoveryEmail">Correo Electrónico</label>
            <input
              [(ngModel)]="recoveryEmail"
              name="recoveryEmail"
              class="bg-transparent border border-outline-variant focus:border-secondary focus:ring-2 focus:ring-secondary/20 rounded px-4 py-3 text-body-md text-on-surface placeholder:text-on-surface-variant/50 transition-colors outline-none"
              id="recoveryEmail"
              placeholder="Ingrese su correo"
              type="email"
              required/>
          </div>

          <!-- Actions -->
          <div class="flex flex-col gap-4">
            <button
              class="w-full bg-secondary text-on-secondary rounded py-4 font-semibold text-sm tracking-wider hover:opacity-90 active:scale-[0.98] transition-all flex justify-center items-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              type="submit"
              [disabled]="isLoading || recoverySuccess">
              <span *ngIf="!isLoading">Enviar enlace</span>
              <span *ngIf="isLoading">Enviando...</span>
              <span class="material-symbols-outlined animate-spin" style="font-size: 18px;" *ngIf="isLoading">sync</span>
              <span class="material-symbols-outlined" style="font-size: 18px;" *ngIf="!isLoading">mail</span>
            </button>
            <a
              (click)="toggleForgotForm(false)"
              class="text-center text-sm text-secondary hover:text-primary transition-colors cursor-pointer hover:underline">
              Volver al inicio de sesión
            </a>
          </div>

        </form>
      </ng-container>

    </div>
  </main>

  <!-- Footer -->
  <footer class="fixed bottom-0 w-full flex flex-col md:flex-row justify-between px-10 py-6 items-center z-10 bg-transparent text-on-surface-variant/80 text-xs font-medium gap-4">
    <div>
      © 2024 Administracion Negocio. Todos los derechos reservados.
    </div>
    <nav class="flex gap-4">
      <a class="hover:text-surface transition-colors hover:underline cursor-pointer">Privacidad</a>
      <a class="hover:text-surface transition-colors hover:underline cursor-pointer">Términos</a>
      <a class="hover:text-surface transition-colors hover:underline cursor-pointer">Soporte</a>
    </nav>
  </footer>

</div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      width: 100%;
    }

    .animate-fade-in {
      animation: fadeIn 0.4s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class Login {
  email = '';
  password = '';
  loginError = false;
  showPassword = false;
  isLoading = false;
  errorMessage = 'Usuario/Contraseña incorrectos.';
  rememberMe = false;

  showForgotForm = false;
  recoveryEmail = '';
  recoverySuccess = false;

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  toggleForgotForm(show: boolean) {
    this.showForgotForm = show;
    this.loginError = false;
    this.errorMessage = '';
    this.recoverySuccess = false;
    this.recoveryEmail = this.email;
  }

  async sendRecoveryEmail() {
    if (this.isLoading) return;

    if (!this.recoveryEmail || !this.recoveryEmail.includes('@')) {
      this.errorMessage = 'Por favor, ingrese un correo electrónico válido.';
      this.loginError = true;
      return;
    }

    this.isLoading = true;
    this.loginError = false;
    this.recoverySuccess = false;

    try {
      await sendPasswordResetEmail(auth, this.recoveryEmail);
      this.recoverySuccess = true;
    } catch (error: any) {
      console.error('Recovery error:', error);
      if (error.code === 'auth/user-not-found') {
        this.errorMessage = 'No existe un usuario registrado con este correo.';
      } else if (error.code === 'auth/invalid-email') {
        this.errorMessage = 'El formato del correo no es válido.';
      } else {
        this.errorMessage = 'Ocurrió un error al enviar el correo. Intente más tarde.';
      }
      this.loginError = true;
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async login() {
    if (this.isLoading) return;

    let loginEmail = this.email.trim();
    if (!loginEmail) {
      this.errorMessage = 'Por favor, ingrese su usuario.';
      this.loginError = true;
      return;
    }

    // Si el usuario no contiene '@', le agregamos un dominio por defecto para que funcione con Firebase Auth
    if (!loginEmail.includes('@')) {
      loginEmail = `${loginEmail}@negociosadlb.com`;
    }

    if (!this.password) {
      this.errorMessage = 'Por favor, ingrese su contraseña.';
      this.loginError = true;
      return;
    }

    this.isLoading = true;
    this.loginError = false;
    this.errorMessage = 'Usuario o contraseña incorrectos.';

    try {
      const result = await this.authService.login(loginEmail, this.password);

      if (!result.success) {
        switch (result.errorCode) {
          case 'auth/invalid-email':
            this.errorMessage = 'El correo electrónico ingresado no es válido.';
            break;
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            this.errorMessage = 'Usuario o contraseña incorrectos.';
            break;
          case 'auth/too-many-requests':
            this.errorMessage = 'Demasiados intentos fallidos. Su cuenta ha sido bloqueada temporalmente.';
            break;
          case 'auth/network-request-failed':
            this.errorMessage = 'Error de conexión. Verifique su internet.';
            break;
          default:
            this.errorMessage = 'Error al iniciar sesión. Intente de nuevo.';
            break;
        }
        this.loginError = true;
      }
    } catch (err) {
      console.error('Error inesperado en el componente Login:', err);
      this.errorMessage = 'Ocurrió un error inesperado. Intente de nuevo.';
      this.loginError = true;
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
      console.log('Login finalizado. isLoading:', this.isLoading);
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }
}
