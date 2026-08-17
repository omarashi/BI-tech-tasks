export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: number;
  categoryName: string;
}

export type SortColumn = 'Name' | 'Price' | 'Stock' | 'CategoryName';

export interface ProductQuery {
  search?: string;
  categoryId?: number;
  sortBy: SortColumn;
  sortDir: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export interface ProductPage {
  items: Product[];
  total: number;
}
