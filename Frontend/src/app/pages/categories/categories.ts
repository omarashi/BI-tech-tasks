import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Category } from '../../models/category';
import { AuthService } from '../../services/auth.service';
import { CatalogService } from '../../services/catalog.service';
import { getErrorMessage } from '../../shared/http-error';

@Component({
  selector: 'app-categories',
  imports: [FormsModule],
  templateUrl: './categories.html',
  styleUrl: './categories.css'
})
export class Categories implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly auth = inject(AuthService);

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly message = signal('');
  readonly saving = signal(false);
  readonly newName = signal('');
  readonly editingId = signal<number | null>(null);
  readonly editingName = signal('');

  get isAdmin(): boolean {
    return this.auth.isAdmin;
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.error.set('');

    this.catalog.getCategories().subscribe({
      next: (data) => {
        this.categories.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(getErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  onAdd(): void {
    const name = this.newName().trim();
    if (!name) {
      return;
    }

    this.saving.set(true);
    this.error.set('');

    this.catalog.createCategory(name).subscribe({
      next: () => {
        this.newName.set('');
        this.saving.set(false);
        this.message.set(`Category "${name}" was added.`);
        this.loadCategories();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(getErrorMessage(err));
        this.saving.set(false);
      }
    });
  }

  startEdit(category: Category): void {
    this.editingId.set(category.id);
    this.editingName.set(category.name);
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  saveEdit(category: Category): void {
    const name = this.editingName().trim();
    if (!name) {
      return;
    }

    this.saving.set(true);
    this.error.set('');

    this.catalog.updateCategory(category.id, name).subscribe({
      next: () => {
        this.editingId.set(null);
        this.saving.set(false);
        this.message.set(`Category renamed to "${name}".`);
        this.loadCategories();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(getErrorMessage(err));
        this.saving.set(false);
      }
    });
  }

  onDelete(category: Category): void {
    if (!confirm(`Delete category "${category.name}"?`)) {
      return;
    }

    this.catalog.deleteCategory(category.id).subscribe({
      next: () => {
        this.message.set(`Category "${category.name}" was deleted.`);
        this.loadCategories();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(getErrorMessage(err));
      }
    });
  }
}
