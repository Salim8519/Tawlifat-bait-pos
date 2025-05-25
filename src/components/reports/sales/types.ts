export interface SalesData {
  month: string;
  total: number;
}

export interface MonthlySalesData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
  }[];
  totals: {
    totalSales: number;
  };
}

export interface SalesFilters {
  paymentMethod?: string;
  minAmount?: number;
  maxAmount?: number;
}
