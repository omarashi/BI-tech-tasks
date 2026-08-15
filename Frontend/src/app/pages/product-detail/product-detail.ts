import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Product } from '../../models/product';
import { AuthService } from '../../services/auth.service';
import { CatalogService } from '../../services/catalog.service';
import { getErrorMessage } from '../../shared/http-error';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.css'
})
export class ProductDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly catalog = inject(CatalogService);
  private readonly auth = inject(AuthService);

  readonly product = signal<Product | undefined>(undefined);
  readonly loading = signal(true);
  readonly error = signal('');

  get isAdmin(): boolean {
    return this.auth.isAdmin;
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.catalog.getProduct(id).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(getErrorMessage(err));
        this.loading.set(false);
      }
    });
  }
}
