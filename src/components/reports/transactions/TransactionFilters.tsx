import React from 'react';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { reportTranslations } from '../../../translations/reports';
import type { TransactionFilters } from './types';
import { Search, Filter, X } from 'lucide-react';

interface TransactionFiltersProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  paymentMethods: string[];
  transactionTypes: string[];
  statuses: string[];
  vendors: Array<{ code: string; name: string }>;
}

export function TransactionFilters({
  filters,
  onFiltersChange,
  paymentMethods,
  transactionTypes,
  statuses,
  vendors
}: TransactionFiltersProps) {
  const { language } = useLanguageStore();
  const t = reportTranslations[language];

  const handleChange = (key: keyof TransactionFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" />
          <h3 className="text-sm font-medium">{t.filters}</h3>
        </div>
        {Object.keys(filters).length > 0 && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <X className="w-4 h-4" />
            {t.clearFilters}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            value={filters.searchTerm || ''}
            onChange={(e) => handleChange('searchTerm', e.target.value)}
            placeholder={t.search}
            className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm"
          />
          <Search className="w-4 h-4 absolute left-2 top-2.5 text-gray-400" />
        </div>

        {/* Payment Method */}
        <select
          value={filters.paymentMethod || ''}
          onChange={(e) => handleChange('paymentMethod', e.target.value || undefined)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">{t.paymentMethod}</option>
          {paymentMethods.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </select>

        {/* Transaction Type */}
        <select
          value={filters.transactionType || ''}
          onChange={(e) => handleChange('transactionType', e.target.value || undefined)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">{t.transactionType}</option>
          {transactionTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          value={filters.status || ''}
          onChange={(e) => handleChange('status', e.target.value || undefined)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">{t.status}</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        {/* Vendor */}
        <select
          value={filters.vendorCode || ''}
          onChange={(e) => handleChange('vendorCode', e.target.value || undefined)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">{t.vendor}</option>
          {vendors.map((vendor) => (
            <option key={vendor.code} value={vendor.code}>
              {vendor.name}
            </option>
          ))}
        </select>

        {/* Amount Range */}
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={filters.minAmount || ''}
            onChange={(e) => handleChange('minAmount', e.target.value ? Number(e.target.value) : undefined)}
            placeholder={t.minAmount}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="number"
            value={filters.maxAmount || ''}
            onChange={(e) => handleChange('maxAmount', e.target.value ? Number(e.target.value) : undefined)}
            placeholder={t.maxAmount}
            className="border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        {/* Sort Options */}
        <div className="grid grid-cols-2 gap-2">
          <select
            value={filters.sortBy || 'date'}
            onChange={(e) => handleChange('sortBy', e.target.value as 'date' | 'amount' | 'profit')}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="date">{t.date}</option>
            <option value="amount">{t.amount}</option>
            <option value="profit">{t.profit}</option>
          </select>
          <select
            value={filters.sortOrder || 'desc'}
            onChange={(e) => handleChange('sortOrder', e.target.value as 'asc' | 'desc')}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="asc">{t.ascending}</option>
            <option value="desc">{t.descending}</option>
          </select>
        </div>
      </div>
    </div>
  );
}
