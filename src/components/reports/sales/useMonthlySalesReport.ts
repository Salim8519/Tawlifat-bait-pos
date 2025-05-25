import { useReportData } from '../../../hooks/useReportData';
import { supabase } from '../../../lib/supabase';
import type { MonthlySalesData, SalesFilters } from './types';
import { startOfDay, endOfDay, parseISO, format } from 'date-fns';

interface UseMonthlySalesReportProps {
  businessCode: string;
  branchName: string;
  startDate: string;
  endDate: string;
  filters?: SalesFilters;
}

export function useMonthlySalesReport({
  businessCode,
  branchName,
  startDate,
  endDate,
  filters = {}
}: UseMonthlySalesReportProps) {
  return useReportData({
    fetchData: async () => {
      // Parse dates and set proper time boundaries
      const start = startOfDay(parseISO(startDate));
      const end = endOfDay(parseISO(endDate));

      console.log('Fetching sales data for date range:', {
        start: start.toISOString(),
        end: end.toISOString(),
        businessCode,
        branchName
      });

      // Query transactions for sales data
      let query = supabase
        .from('transactions_overall')
        .select('*')
        .eq('business_code', businessCode)
        .in('transaction_type', ['sale', 'vendor_sale']) // Only include sales transactions
        .gte('transaction_date', start.toISOString())
        .lte('transaction_date', end.toISOString());

      // Add branch filtering if specific branch selected
      if (branchName !== 'all') {
        query = query.eq('branch_name', branchName);
      }

      // Apply filters
      if (filters.paymentMethod) {
        query = query.eq('payment_method', filters.paymentMethod);
      }
      if (filters.minAmount) {
        query = query.gte('amount', filters.minAmount);
      }
      if (filters.maxAmount) {
        query = query.lte('amount', filters.maxAmount);
      }

      const { data: transactions, error } = await query;

      if (error) {
        throw new Error(`Error fetching sales data: ${error.message}`);
      }

      // Process the data to group by month
      const monthlyData: Record<string, number> = {};
      let totalSales = 0;

      transactions.forEach(transaction => {
        const date = new Date(transaction.transaction_date);
        const monthKey = format(date, 'yyyy-MM');
        const monthLabel = format(date, 'MMM yyyy');
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = 0;
        }
        
        monthlyData[monthKey] += Number(transaction.amount) || 0;
        totalSales += Number(transaction.amount) || 0;
      });

      // Sort months chronologically
      const sortedMonths = Object.keys(monthlyData).sort();
      
      // Prepare data for Chart.js
      const chartData: MonthlySalesData = {
        labels: sortedMonths.map(month => {
          const date = parseISO(`${month}-01`);
          return format(date, 'MMM yyyy');
        }),
        datasets: [
          {
            label: 'Sales',
            data: sortedMonths.map(month => monthlyData[month]),
            backgroundColor: 'rgba(53, 162, 235, 0.5)',
            borderColor: 'rgba(53, 162, 235, 1)',
            borderWidth: 1,
          },
        ],
        totals: {
          totalSales: parseFloat(totalSales.toFixed(2))
        }
      };

      return chartData;
    },
    dependencies: [businessCode, branchName, startDate, endDate, JSON.stringify(filters)]
  });
}
