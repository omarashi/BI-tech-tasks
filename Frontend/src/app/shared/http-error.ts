import { HttpErrorResponse } from '@angular/common/http';

export function getErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'Cannot reach the server. Make sure the backend is running.';
    }
    if (typeof error.error === 'string' && error.error.trim()) {
      return error.error.trim();
    }
    if (error.status >= 500) {
      return 'The server had a problem. Please try again.';
    }
    if (error.status >= 400) {
      return `Request failed (${error.status}). Please try again.`;
    }
    return `Request failed (${error.status}).`;
  }
  return 'Something went wrong. Please try again.';
}
