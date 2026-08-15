import { Routes } from '@angular/router';

import { adminGuard, authGuard } from './guards/auth.guard';
import { Categories } from './pages/categories/categories';
import { Login } from './pages/login/login';
import { ProductDetail } from './pages/product-detail/product-detail';
import { ProductForm } from './pages/product-form/product-form';
import { Products } from './pages/products/products';

export const routes: Routes = [
  { path: '', redirectTo: '/products', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'products', component: Products, canActivate: [authGuard] },
  { path: 'products/new', component: ProductForm, canActivate: [authGuard, adminGuard] },
  { path: 'products/:id', component: ProductDetail, canActivate: [authGuard] },
  { path: 'products/:id/edit', component: ProductForm, canActivate: [authGuard, adminGuard] },
  { path: 'categories', component: Categories, canActivate: [authGuard] },
  { path: '**', redirectTo: '/products' }
];
