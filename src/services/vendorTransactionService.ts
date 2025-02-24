import { supabase } from '../lib/supabase';
import type { VendorTransaction, TransactionType, CreateVendorTransactionInput } from '../types/vendorTransaction';

/**
 * Smart service for handling vendor transactions
 */
class VendorTransactionService {
  private static instance: VendorTransactionService;

  private constructor() {}

  static getInstance(): VendorTransactionService {
    if (!VendorTransactionService.instance) {
      VendorTransactionService.instance = new VendorTransactionService();
    }
    return VendorTransactionService.instance;
  }

  /**
   * Create a new vendor transaction with smart defaults and validations
   */
  async createTransaction(input: CreateVendorTransactionInput): Promise<VendorTransaction> {
    try {
      // Calculate new accumulated profit for this specific business-branch-vendor combination
      const newAccumulatedProfit = await this.calculateAccumulatedProfit(
        input.business_code,
        input.branch_name,
        input.vendor_code,
        input.profit || 0
      );

      // Prepare transaction data with the new accumulated profit
      const transactionData = await this.prepareTransactionData({
        ...input,
        accumulated_profit: newAccumulatedProfit
      });

      const { data, error } = await supabase
        .from('vendor_transactions')
        .insert([transactionData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating vendor transaction:', error);
      throw error;
    }
  }

  /**
   * Smart preparation of transaction data with automatic calculations
   */
  private async prepareTransactionData(input: CreateVendorTransactionInput): Promise<Omit<VendorTransaction, 'created_at'>> {
    const {
      transaction_type,
      business_code,
      business_name,
      vendor_code,
      vendor_name,
      branch_name,
      amount,
      ...rest
    } = input;

    // Base transaction data
    const baseTransaction = {
      transaction_id: `${business_code}_${branch_name}_${Date.now()}`,
      transaction_date: new Date().toISOString().split('T')[0],
      business_code,
      business_name,
      vendor_code,
      vendor_name,
      branch_name,
      amount,
      profit: input.profit || 0,
      accumulated_profit: input.accumulated_profit,
      status: 'completed',
      transaction_type,
    };

    // Type-specific data preparation
    switch (transaction_type) {
      case 'product_sale':
        return this.prepareProductSaleData(baseTransaction, rest);
      case 'rental':
        return this.prepareRentalData(baseTransaction, rest);
      case 'tax':
        return this.prepareTaxData(baseTransaction, rest);
      default:
        throw new Error(`Invalid transaction type: ${transaction_type}`);
    }
  }

  private prepareProductSaleData(baseTransaction: any, data: any) {
    const { product_quantity, unit_price, total_price } = data;
    
    return {
      ...baseTransaction,
      product_name: data.product_name,
      product_quantity,
      unit_price,
      // If total_price is provided, use it directly (for bulk sales)
      // Otherwise calculate from unit_price * quantity (for single item sales)
      total_price: total_price || (unit_price * product_quantity),
      notes: data.notes || `Product sale: ${data.product_name}`,
    };
  }

  private prepareRentalData(baseTransaction: any, data: any) {
    const { rental_start_date, rental_end_date, rental_period } = data;
    
    return {
      ...baseTransaction,
      rental_start_date,
      rental_end_date,
      rental_period: rental_period || this.calculateRentalPeriod(rental_start_date, rental_end_date),
      notes: data.notes || 'Rental payment',
    };
  }

  private prepareTaxData(baseTransaction: any, data: any) {
    return {
      ...baseTransaction,
      tax_period: data.tax_period || this.getCurrentTaxPeriod(),
      tax_description: data.tax_description || 'Monthly tax payment',
      notes: data.notes || 'Tax payment',
    };
  }

  private calculateRentalPeriod(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
    return `${months} months`;
  }

  private getCurrentTaxPeriod(): string {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Calculate accumulated profit for specific business, branch, and vendor
   */
  private async calculateAccumulatedProfit(
    business_code: string,
    branch_name: string,
    vendor_code: string,
    newProfit: number
  ): Promise<number> {
    try {
      // Get the latest accumulated profit for this specific business-branch-vendor combination
      const { data: previousTransaction } = await supabase
        .from('vendor_transactions')
        .select('accumulated_profit')
        .eq('business_code', business_code)
        .eq('branch_name', branch_name)
        .eq('vendor_code', vendor_code)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return (previousTransaction?.accumulated_profit || 0) + newProfit;
    } catch (error) {
      console.error('Error calculating accumulated profit:', error);
      return newProfit; // Start fresh if no previous records
    }
  }

  /**
   * Get vendor transactions with smart filtering
   */
  async getTransactions(filters: {
    business_code?: string;
    branch_name?: string;
    vendor_code?: string;
    transaction_type?: TransactionType;
    start_date?: string;
    end_date?: string;
    status?: string;
  } = {}) {
    try {
      let query = supabase
        .from('vendor_transactions')
        .select('*');

      // Apply filters
      if (filters.business_code) {
        query = query.eq('business_code', filters.business_code);
      }
      if (filters.branch_name) {
        query = query.eq('branch_name', filters.branch_name);
      }
      if (filters.vendor_code) {
        query = query.eq('vendor_code', filters.vendor_code);
      }
      if (filters.transaction_type) {
        query = query.eq('transaction_type', filters.transaction_type);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.start_date) {
        query = query.gte('transaction_date', filters.start_date);
      }
      if (filters.end_date) {
        query = query.lte('transaction_date', filters.end_date);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting vendor transactions:', error);
      throw error;
    }
  }

  /**
   * Get vendor transaction statistics
   */
  async getTransactionStats(filters: {
    business_code: string;
    branch_name: string;
    vendor_code?: string;
    start_date?: string;
    end_date?: string;
  }) {
    try {
      let query = supabase
        .from('vendor_transactions')
        .select('*')
        .eq('business_code', filters.business_code)
        .eq('branch_name', filters.branch_name);

      if (filters.vendor_code) {
        query = query.eq('vendor_code', filters.vendor_code);
      }
      if (filters.start_date) {
        query = query.gte('transaction_date', filters.start_date);
      }
      if (filters.end_date) {
        query = query.lte('transaction_date', filters.end_date);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        total_transactions: data.length,
        total_amount: data.reduce((sum, t) => sum + Number(t.amount), 0),
        total_profit: data.reduce((sum, t) => sum + Number(t.profit), 0),
        by_type: data.reduce((acc, t) => {
          acc[t.transaction_type] = (acc[t.transaction_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        latest_accumulated_profit: data[0]?.accumulated_profit || 0
      };
    } catch (error) {
      console.error('Error getting vendor transaction stats:', error);
      throw error;
    }
  }

  /**
   * Get branch-specific profit summary
   */
  async getBranchProfitSummary(
    business_code: string,
    branch_name: string,
    filters?: {
      start_date?: string;
      end_date?: string;
      vendor_code?: string;
      transaction_type?: TransactionType;
    }
  ) {
    try {
      let query = supabase
        .from('vendor_transactions')
        .select('*')
        .eq('business_code', business_code)
        .eq('branch_name', branch_name);

      if (filters?.vendor_code) {
        query = query.eq('vendor_code', filters.vendor_code);
      }
      if (filters?.transaction_type) {
        query = query.eq('transaction_type', filters.transaction_type);
      }
      if (filters?.start_date) {
        query = query.gte('transaction_date', filters.start_date);
      }
      if (filters?.end_date) {
        query = query.lte('transaction_date', filters.end_date);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group profits by vendor
      const vendorProfits = data.reduce((acc, transaction) => {
        const key = transaction.vendor_code;
        if (!acc[key]) {
          acc[key] = {
            vendor_code: transaction.vendor_code,
            vendor_name: transaction.vendor_name,
            total_profit: 0,
            accumulated_profit: 0,
            transactions_count: 0,
            by_type: {} as Record<TransactionType, {
              count: number;
              profit: number;
            }>
          };
        }

        acc[key].total_profit += Number(transaction.profit);
        acc[key].accumulated_profit = Number(transaction.accumulated_profit);
        acc[key].transactions_count++;

        // Track by transaction type
        if (!acc[key].by_type[transaction.transaction_type]) {
          acc[key].by_type[transaction.transaction_type] = {
            count: 0,
            profit: 0
          };
        }
        acc[key].by_type[transaction.transaction_type].count++;
        acc[key].by_type[transaction.transaction_type].profit += Number(transaction.profit);

        return acc;
      }, {} as Record<string, {
        vendor_code: string;
        vendor_name: string;
        total_profit: number;
        accumulated_profit: number;
        transactions_count: number;
        by_type: Record<TransactionType, {
          count: number;
          profit: number;
        }>;
      }>);

      return {
        branch_total_profit: Object.values(vendorProfits).reduce((sum, v) => sum + v.total_profit, 0),
        vendors: vendorProfits,
        period: {
          start: filters?.start_date || data[0]?.transaction_date,
          end: filters?.end_date || data[data.length - 1]?.transaction_date
        }
      };
    } catch (error) {
      console.error('Error getting branch profit summary:', error);
      throw error;
    }
  }

  /**
   * Get profit trends for a specific branch
   */
  async getBranchProfitTrends(
    business_code: string,
    branch_name: string,
    period: 'daily' | 'weekly' | 'monthly' = 'monthly',
    start_date?: string,
    end_date?: string
  ) {
    try {
      let query = supabase
        .from('vendor_transactions')
        .select('*')
        .eq('business_code', business_code)
        .eq('branch_name', branch_name);

      if (start_date) {
        query = query.gte('transaction_date', start_date);
      }
      if (end_date) {
        query = query.lte('transaction_date', end_date);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by period
      const trends = data.reduce((acc, transaction) => {
        const date = new Date(transaction.transaction_date);
        let key: string;

        switch (period) {
          case 'daily':
            key = transaction.transaction_date;
            break;
          case 'weekly':
            const weekNumber = Math.ceil((date.getDate() - 1 - date.getDay()) / 7) + 1;
            key = `${date.getFullYear()}-W${weekNumber}`;
            break;
          case 'monthly':
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            break;
        }

        if (!acc[key]) {
          acc[key] = {
            period: key,
            total_profit: 0,
            transaction_count: 0,
            by_type: {} as Record<TransactionType, number>
          };
        }

        acc[key].total_profit += Number(transaction.profit);
        acc[key].transaction_count++;
        acc[key].by_type[transaction.transaction_type] = 
          (acc[key].by_type[transaction.transaction_type] || 0) + Number(transaction.profit);

        return acc;
      }, {} as Record<string, {
        period: string;
        total_profit: number;
        transaction_count: number;
        by_type: Record<TransactionType, number>;
      }>);

      return Object.values(trends).sort((a, b) => a.period.localeCompare(b.period));
    } catch (error) {
      console.error('Error getting branch profit trends:', error);
      throw error;
    }
  }
}

export const vendorTransactionService = VendorTransactionService.getInstance();
