import { supabase } from '../lib/supabase';
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';

export type DateRangeType = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_3_months' | 'custom';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface FetchTransactionsParams {
  vendorCode: string;
  dateRange: DateRangeType;
  customStartDate?: Date;
  customEndDate?: Date;
}

export const getDateRangeForType = (type: DateRangeType, customStartDate?: Date, customEndDate?: Date): DateRange => {
  const now = new Date();

  switch (type) {
    case 'today':
      return {
        startDate: startOfDay(now),
        endDate: endOfDay(now)
      };
    case 'yesterday':
      const yesterday = subDays(now, 1);
      return {
        startDate: startOfDay(yesterday),
        endDate: endOfDay(yesterday)
      };
    case 'this_week':
      return {
        startDate: startOfWeek(now, { weekStartsOn: 1 }), // Week starts on Monday
        endDate: endOfWeek(now, { weekStartsOn: 1 })
      };
    case 'this_month':
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now)
      };
    case 'last_3_months':
      return {
        startDate: startOfDay(subMonths(now, 3)),
        endDate: endOfDay(now)
      };
    case 'custom':
      if (!customStartDate || !customEndDate) {
        throw new Error('Custom date range requires both start and end dates');
      }
      return {
        startDate: startOfDay(customStartDate),
        endDate: endOfDay(customEndDate)
      };
    default:
      return {
        startDate: startOfDay(now),
        endDate: endOfDay(now)
      };
  }
};

export const fetchVendorDashboardTransactions = async ({
  vendorCode,
  dateRange,
  customStartDate,
  customEndDate
}: FetchTransactionsParams) => {
  try {
    const { startDate, endDate } = getDateRangeForType(dateRange, customStartDate, customEndDate);

    const { data, error } = await supabase
      .from('vendor_transactions')
      .select('*')
      .eq('vendor_code', vendorCode)
      .gte('transaction_date', startDate.toISOString())
      .lte('transaction_date', endDate.toISOString())
      .order('transaction_date', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching vendor transactions:', error);
    throw error;
  }
};
