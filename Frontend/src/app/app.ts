import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  get isLoggedIn(): boolean {
    return this.auth.isLoggedIn;
  }

  get username(): string | null {
    return this.auth.username;
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
