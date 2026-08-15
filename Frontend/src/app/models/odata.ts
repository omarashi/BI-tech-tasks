export interface ODataCategory {
  Id: number;
  Name: string;
}

export interface ODataProduct {
  Id: number;
  Name: string;
  Description: string;
  Price: number;
  Stock: number;
  CategoryId: number;
  Category?: ODataCategory;
}

export interface ODataResponse<T> {
  '@odata.count'?: number;
  value: T[];
}
