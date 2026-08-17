import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { getErrorMessage } from '../../shared/http-error';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly error = signal('');
  readonly loading = signal(false);
  readonly submitted = signal(false);
  readonly isRegisterMode = signal(false);

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  ngOnInit(): void {
    if (this.auth.isLoggedIn) {
      this.router.navigate(['/products']);
      return;
    }

    this.route.queryParamMap.subscribe((params) => {
      if (params.get('reason') === 'session-expired') {
        this.error.set('Your session has expired. Please sign in again.');
      }
    });
  }

  toggleMode(): void {
    this.isRegisterMode.set(!this.isRegisterMode());
    this.submitted.set(false);
    this.error.set('');
  }

  onSubmit(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      return;
    }

    const { username, password } = this.form.getRawValue();
    this.error.set('');
    this.loading.set(true);

    const request = this.isRegisterMode()
      ? this.auth.register(username, password)
      : this.auth.login(username, password);

    request.subscribe({
      next: (response) => {
        this.auth.saveSession(response);
        this.router.navigate(['/products'], { replaceUrl: true });
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(err.status === 401 ? 'Invalid username or password.' : getErrorMessage(err));
      }
    });
  }
}
