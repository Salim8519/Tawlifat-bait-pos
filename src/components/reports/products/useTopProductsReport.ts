import { useReportData } from '../../../hooks/useReportData';
import { supabase } from '../../../lib/supabase';
import type { TopProductsData, ProductFilters } from './types';
import { startOfDay, endOfDay, parseISO } from 'date-fns';

interface UseTopProductsReportProps {
  businessCode: string;
  branchName: string;
  startDate: string;
  endDate: string;
  filters?: ProductFilters;
}

export function useTopProductsReport({
  businessCode,
  branchName,
  startDate,
  endDate,
  filters = {}
}: UseTopProductsReportProps) {
  return useReportData({
    fetchData: async () => {
      // Parse dates and set proper time boundaries
      const start = startOfDay(parseISO(startDate));
      const end = endOfDay(parseISO(endDate));

      console.log('Fetching top products data for date range:', {
        start: start.toISOString(),
        end: end.toISOString(),
        businessCode,
        branchName
      });

      // First, get all receipts for the given period and branch
      let receiptsQuery = supabase
        .from('receipts')
        .select('receipt_id')
        .eq('business_code', businessCode)
        .gte('receipt_date', start.toISOString())
        .lte('receipt_date', end.toISOString());

      // Add branch filtering if specific branch selected
      if (branchName !== 'all') {
        receiptsQuery = receiptsQuery.eq('branch_name', branchName);
      }

      const { data: receipts, error: receiptsError } = await receiptsQuery;

      if (receiptsError) {
        throw new Error(`Error fetching receipts: ${receiptsError.message}`);
      }

      if (!receipts || receipts.length === 0) {
        return {
          products: [],
          totals: {
            totalQuantity: 0,
            totalSales: 0
          }
        };
      }

      // Get the receipt IDs
      const receiptIds = receipts.map(receipt => receipt.receipt_id);

      // Now fetch sold products for these receipts
      const { data: soldProducts, error: soldProductsError } = await supabase
        .from('sold_products')
        .select('*')
        .in('receipt_id', receiptIds);

      if (soldProductsError) {
        throw new Error(`Error fetching sold products: ${soldProductsError.message}`);
      }

      if (!soldProducts || soldProducts.length === 0) {
        return {
          products: [],
          totals: {
            totalQuantity: 0,
            totalSales: 0
          }
        };
      }

      // Group and aggregate the data by product
      const productMap = new Map();
      
      soldProducts.forEach(product => {
        const productId = product.product_id;
        const productName = product.product_name;
        const quantity = Number(product.quantity) || 0;
        const unitPrice = Number(product.unit_price_original) || 0;
        const totalPrice = quantity * unitPrice;
        
        if (productMap.has(productId)) {
          const existingProduct = productMap.get(productId);
          existingProduct.quantity_sold += quantity;
          existingProduct.total_sales += totalPrice;
        } else {
          productMap.set(productId, {
            product_id: productId,
            product_name: productName,
            quantity_sold: quantity,
            total_sales: totalPrice,
            unit_price: unitPrice
          });
        }
      });

      // Convert map to array and sort by quantity sold (descending)
      let products = Array.from(productMap.values());

      // Apply filters if provided
      if (filters.minQuantity) {
        products = products.filter(p => p.quantity_sold >= (filters.minQuantity || 0));
      }
      if (filters.maxQuantity) {
        products = products.filter(p => p.quantity_sold <= (filters.maxQuantity || Infinity));
      }
      if (filters.minPrice) {
        products = products.filter(p => p.unit_price >= (filters.minPrice || 0));
      }
      if (filters.maxPrice) {
        products = products.filter(p => p.unit_price <= (filters.maxPrice || Infinity));
      }

      // Sort by quantity sold (descending)
      products.sort((a, b) => b.quantity_sold - a.quantity_sold);

      // Apply limit if provided
      const limit = filters.limit || 10; // Default to top 10 products
      products = products.slice(0, limit);

      // Calculate totals
      const totalQuantity = products.reduce((sum, product) => sum + product.quantity_sold, 0);
      const totalSales = products.reduce((sum, product) => sum + product.total_sales, 0);

      return {
        products,
        totals: {
          totalQuantity,
          totalSales: parseFloat(totalSales.toFixed(2))
        }
      };
    },
    dependencies: [businessCode, branchName, startDate, endDate, JSON.stringify(filters)]
  });
}
