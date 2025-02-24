import { supabase } from '../lib/supabase';

export interface VendorTax {
  id: string;
  business_code: string;
  vendor_code: string;
  vendor_name: string;
  branch_name: string;
  tax_period: string;
  tax_amount: number;
  tax_description?: string;
  payment_status: 'pending' | 'paid' | 'overdue';
  due_date: string;
  payment_date?: string;
  created_at?: string;
}

export interface CreateVendorTaxInput {
  business_code: string;
  vendor_code: string;
  vendor_name: string;
  branch_name: string;
  tax_period: string;
  tax_amount: number;
  tax_description?: string;
  due_date: string;
}

class VendorTaxService {
  private static instance: VendorTaxService;

  private constructor() {}

  static getInstance(): VendorTaxService {
    if (!VendorTaxService.instance) {
      VendorTaxService.instance = new VendorTaxService();
    }
    return VendorTaxService.instance;
  }

  /**
   * Create a new vendor tax record
   */
  async createTax(input: CreateVendorTaxInput): Promise<VendorTax> {
    try {
      const taxData = {
        ...input,
        id: `${input.business_code}_${input.vendor_code}_${input.tax_period}`,
        payment_status: 'pending',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('vendor_taxes')
        .insert([taxData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating vendor tax:', error);
      throw error;
    }
  }

  /**
   * Get vendor taxes with smart filtering
   */
  async getTaxes(filters: {
    business_code?: string;
    branch_name?: string;
    vendor_code?: string;
    payment_status?: string;
    tax_period?: string;
  } = {}) {
    try {
      let query = supabase
        .from('vendor_taxes')
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
      if (filters.payment_status) {
        query = query.eq('payment_status', filters.payment_status);
      }
      if (filters.tax_period) {
        query = query.eq('tax_period', filters.tax_period);
      }

      // Order by due date
      query = query.order('due_date', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching vendor taxes:', error);
      throw error;
    }
  }

  /**
   * Update tax payment status
   */
  async updatePaymentStatus(
    taxId: string,
    status: 'paid' | 'pending' | 'overdue',
    paymentDate?: string
  ): Promise<VendorTax> {
    try {
      const updateData: any = {
        payment_status: status
      };

      if (status === 'paid' && paymentDate) {
        updateData.payment_date = paymentDate;
      }

      const { data, error } = await supabase
        .from('vendor_taxes')
        .update(updateData)
        .eq('id', taxId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating vendor tax payment status:', error);
      throw error;
    }
  }

  /**
   * Get overdue taxes for a business
   */
  async getOverdueTaxes(business_code: string): Promise<VendorTax[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('vendor_taxes')
        .select('*')
        .eq('business_code', business_code)
        .eq('payment_status', 'pending')
        .lt('due_date', today)
        .order('due_date', { ascending: true });

      if (error) throw error;

      // Update status to overdue
      await Promise.all(
        data.map(tax => 
          this.updatePaymentStatus(tax.id, 'overdue')
        )
      );

      return data;
    } catch (error) {
      console.error('Error fetching overdue vendor taxes:', error);
      throw error;
    }
  }

  /**
   * Calculate tax summary for a vendor
   */
  async getVendorTaxSummary(business_code: string, vendor_code: string) {
    try {
      const { data, error } = await supabase
        .from('vendor_taxes')
        .select('*')
        .eq('business_code', business_code)
        .eq('vendor_code', vendor_code);

      if (error) throw error;

      return {
        total_taxes: data.reduce((sum, tax) => sum + tax.tax_amount, 0),
        paid_taxes: data
          .filter(tax => tax.payment_status === 'paid')
          .reduce((sum, tax) => sum + tax.tax_amount, 0),
        pending_taxes: data
          .filter(tax => tax.payment_status === 'pending')
          .reduce((sum, tax) => sum + tax.tax_amount, 0),
        overdue_taxes: data
          .filter(tax => tax.payment_status === 'overdue')
          .reduce((sum, tax) => sum + tax.tax_amount, 0),
        tax_records: data
      };
    } catch (error) {
      console.error('Error calculating vendor tax summary:', error);
      throw error;
    }
  }
}

export const vendorTaxService = VendorTaxService.getInstance();

/**
 * Calculate monthly vendor tax for a specific vendor in a specific branch
 * @param params Parameters for tax calculation
 * @returns The calculated tax amount based on vendor's profit
 */
export interface CalculateMonthlyTaxParams {
  businessCode: string;
  branchName: string;
  vendorCode: string;
  monthYear: string; // Format: 'YYYY-MM'
}

export interface MonthlyTaxResult {
  totalProfit: number;
  taxPercentage: number;
  taxAmount: number;
  monthYear: string;
  vendorCode: string;
  branchName: string;
}

export async function calculateMonthlyVendorTax(params: CalculateMonthlyTaxParams): Promise<MonthlyTaxResult> {
  try {
    // First, get the business settings to get the tax percentage
    const { data: settingsData, error: settingsError } = await supabase
      .from('business_settings')
      .select('extra_tax_monthly_on_vendors')
      .eq('business_code_', params.businessCode)
      .single();

    if (settingsError) throw settingsError;
    if (!settingsData) throw new Error('Business settings not found');

    const taxPercentage = settingsData.extra_tax_monthly_on_vendors || 0;

    // If tax percentage is 0, no need to calculate further
    if (taxPercentage === 0) {
      return {
        totalProfit: 0,
        taxPercentage: 0,
        taxAmount: 0,
        monthYear: params.monthYear,
        vendorCode: params.vendorCode,
        branchName: params.branchName
      };
    }

    // Get the start and end date of the month
    const [year, month] = params.monthYear.split('-');
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(parseInt(year), parseInt(month), 0).toISOString().split('T')[0];

    // Calculate total profit for the vendor in the specified month
    const { data: transactionsData, error: transactionsError } = await supabase
      .from('vendor_transactions')
      .select('profit')
      .eq('business_code', params.businessCode)
      .eq('branch_name', params.branchName)
      .eq('vendor_code', params.vendorCode)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .eq('status', 'completed');

    if (transactionsError) throw transactionsError;

    // Sum up all profits
    const totalProfit = transactionsData.reduce((sum, transaction) => sum + (transaction.profit || 0), 0);

    // Calculate tax amount
    const taxAmount = (totalProfit * taxPercentage) / 100;

    return {
      totalProfit,
      taxPercentage,
      taxAmount,
      monthYear: params.monthYear,
      vendorCode: params.vendorCode,
      branchName: params.branchName
    };

  } catch (error) {
    console.error('Error calculating monthly vendor tax:', error);
    throw error;
  }
}
