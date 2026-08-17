import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Category } from '../models/category';
import { ODataCategory, ODataProduct, ODataResponse } from '../models/odata';
import { Product, ProductPage, ProductQuery } from '../models/product';
import { API_PRODUCTS_URL } from '../shared/api-urls';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);

  getProductPage(query: ProductQuery): Observable<ProductPage> {
    const filters: string[] = [];
    const search = query.search?.trim();
    if (search) {
      filters.push(`contains(tolower(Name),tolower('${encodeURIComponent(search.replace(/'/g, "''"))}'))`);
    }
    if (query.categoryId) {
      filters.push(`CategoryId eq ${query.categoryId}`);
    }

    const orderBy = query.sortBy === 'CategoryName' ? 'Category/Name' : query.sortBy;

    const parts = [
      '$expand=Category($select=Name)',
      '$select=Id,Name,Price,Stock,CategoryId,Category',
      '$count=true'
    ];
    if (filters.length) parts.push(`$filter=${filters.join(' and ')}`);
    parts.push(`$orderby=${orderBy} ${query.sortDir}`);
    parts.push(`$top=${query.pageSize}`);
    parts.push(`$skip=${(query.page - 1) * query.pageSize}`);

    return this.http
      .get<ODataResponse<ODataProduct>>(`${API_PRODUCTS_URL}/odata/Products?${encodeURI(parts.join('&'))}`)
      .pipe(
        map((response) => ({
          items: (response.value ?? []).map((p) => this.toProduct(p)),
          total: response['@odata.count'] ?? 0
        }))
      );
  }

  private toProduct(p: ODataProduct): Product {
    return {
      id: p.Id,
      name: p.Name,
      description: p.Description,
      price: p.Price,
      stock: p.Stock,
      categoryId: p.CategoryId,
      categoryName: p.Category?.Name ?? ''
    };
  }

  getProduct(id: number): Observable<Product> {
    return this.http
      .get<ODataProduct>(`${API_PRODUCTS_URL}/odata/Products(${id})?$expand=Category`)
      .pipe(map((p) => this.toProduct(p)));
  }

  createProduct(product: Product): Observable<Product> {
    return this.http.post<Product>(`${API_PRODUCTS_URL}/api/products`, this.writeBody(product));
  }

  updateProduct(id: number, product: Product): Observable<void> {
    return this.http.put<void>(`${API_PRODUCTS_URL}/api/products/${id}`, this.writeBody(product));
  }

  private writeBody(product: Product): {
    name: string;
    description: string;
    price: number;
    stock: number;
    categoryId: number;
  } {
    return {
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      categoryId: product.categoryId
    };
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${API_PRODUCTS_URL}/api/products/${id}`);
  }

  getCategories(): Observable<Category[]> {
    return this.http
      .get<ODataResponse<ODataCategory>>(`${API_PRODUCTS_URL}/odata/Categories`)
      .pipe(map((response) => (response.value ?? []).map((c) => ({ id: c.Id, name: c.Name }))));
  }

  createCategory(name: string): Observable<Category> {
    return this.http.post<Category>(`${API_PRODUCTS_URL}/api/categories`, { name });
  }

  updateCategory(id: number, name: string): Observable<Category> {
    return this.http.put<Category>(`${API_PRODUCTS_URL}/api/categories/${id}`, { name });
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${API_PRODUCTS_URL}/api/categories/${id}`);
  }
}
