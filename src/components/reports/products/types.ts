export interface ProductSalesData {
  product_id: number;
  product_name: string;
  quantity_sold: number;
  total_sales: number;
  unit_price: number;
}

export interface TopProductsData {
  products: ProductSalesData[];
  totals: {
    totalQuantity: number;
    totalSales: number;
  };
}

export interface ProductFilters {
  minQuantity?: number;
  maxQuantity?: number;
  minPrice?: number;
  maxPrice?: number;
  limit?: number;
}
