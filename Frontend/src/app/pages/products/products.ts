import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Category } from '../../models/category';
import { Product, SortColumn } from '../../models/product';
import { AuthService } from '../../services/auth.service';
import { CatalogService } from '../../services/catalog.service';
import { getErrorMessage } from '../../shared/http-error';

@Component({
  selector: 'app-products',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './products.html',
  styleUrl: './products.css'
})
export class Products implements OnInit {
  private readonly catalog = inject(CatalogService);
  private readonly auth = inject(AuthService);

  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly message = signal('');
  readonly search = signal('');
  readonly categoryId = signal<number | null>(null);
  readonly sortBy = signal<SortColumn>('Name');
  readonly sortDir = signal<'asc' | 'desc'>('asc');
  readonly page = signal(1);
  readonly pageSize = 8;
  readonly total = signal(0);

  private searchTimer: ReturnType<typeof setTimeout> | undefined;

  get isAdmin(): boolean {
    return this.auth.isAdmin;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total() / this.pageSize));
  }

  ngOnInit(): void {
    this.catalog.getCategories().subscribe({
      next: (data) => this.categories.set(data),
      error: () => {}
    });
    this.loadProducts();
  }

  onSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.reload(), 300);
  }

  onCategory(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.categoryId.set(value ? Number(value) : null);
    this.reload();
  }

  onSort(column: SortColumn): void {
    if (this.sortBy() === column) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(column);
      this.sortDir.set('asc');
    }
    this.reload();
  }

  prevPage(): void {
    if (this.page() > 1) {
      this.page.set(this.page() - 1);
      this.loadProducts();
    }
  }

  nextPage(): void {
    if (this.page() < this.totalPages) {
      this.page.set(this.page() + 1);
      this.loadProducts();
    }
  }

  reload(): void {
    this.page.set(1);
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.error.set('');

    this.catalog
      .getProductPage({
        search: this.search(),
        categoryId: this.categoryId() ?? undefined,
        sortBy: this.sortBy(),
        sortDir: this.sortDir(),
        page: this.page(),
        pageSize: this.pageSize
      })
      .subscribe({
        next: (data) => {
          this.products.set(data.items);
          this.total.set(data.total);
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(getErrorMessage(err));
          this.loading.set(false);
        }
      });
  }

  onDelete(product: Product): void {
    if (!confirm(`Delete "${product.name}"?`)) {
      return;
    }

    this.catalog.deleteProduct(product.id).subscribe({
      next: () => {
        this.message.set(`"${product.name}" was deleted.`);
        if (this.products().length === 1 && this.page() > 1) {
          this.page.set(this.page() - 1);
        }
        this.loadProducts();
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(getErrorMessage(err));
      }
    });
  }
}
