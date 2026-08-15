import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Category } from '../../models/category';
import { Product } from '../../models/product';
import { CatalogService } from '../../services/catalog.service';
import { getErrorMessage } from '../../shared/http-error';

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './product-form.html',
  styleUrl: './product-form.css'
})
export class ProductForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly catalog = inject(CatalogService);

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly submitted = signal(false);

  isEdit = false;
  productId = 0;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', Validators.maxLength(500)],
    price: [0, [Validators.required, Validators.min(0)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    categoryId: [0, [Validators.required, Validators.min(1)]]
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.isEdit = idParam !== null;

    if (this.isEdit) {
      this.productId = Number(idParam);
      this.loadProduct();
    } else {
      this.loadCategories();
      this.loading.set(false);
    }
  }

  loadProduct(): void {
    this.catalog.getProduct(this.productId).subscribe({
      next: (product) => {
        this.form.patchValue({
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          categoryId: product.categoryId
        });
        this.loadCategories();
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(getErrorMessage(err));
        this.loading.set(false);
      }
    });
  }

  loadCategories(): void {
    this.catalog.getCategories().subscribe({
      next: (data) => {
        this.categories.set(data);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(getErrorMessage(err));
      }
    });
  }

  onSubmit(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      return;
    }

    const values = this.form.getRawValue();
    const product: Product = {
      id: this.productId,
      name: values.name,
      description: values.description,
      price: values.price,
      stock: values.stock,
      categoryId: values.categoryId,
      categoryName: ''
    };

    this.saving.set(true);
    this.error.set('');

    const request: Observable<Product | void> = this.isEdit
      ? this.catalog.updateProduct(product.id, product)
      : this.catalog.createProduct(product);

    request.subscribe({
      next: () => this.router.navigate(['/products']),
      error: (err: HttpErrorResponse) => {
        this.error.set(getErrorMessage(err));
        this.saving.set(false);
      }
    });
  }
}
