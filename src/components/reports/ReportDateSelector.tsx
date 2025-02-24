import React from 'react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { reportTranslations } from '../../translations/reports';

export type ReportDatePeriod = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisWeek' | 'thisMonth' | 'custom';

interface ReportDateSelectorProps {
  selectedPeriod: ReportDatePeriod;
  onPeriodChange: (period: ReportDatePeriod) => void;
  onCustomDateChange: (startDate: string, endDate: string) => void;
  customStartDate?: string;
  customEndDate?: string;
}

export function ReportDateSelector({
  selectedPeriod,
  onPeriodChange,
  onCustomDateChange,
  customStartDate,
  customEndDate
}: ReportDateSelectorProps) {
  const { language } = useLanguageStore();
  const t = reportTranslations[language];

  const handleCustomDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'startDate') {
      onCustomDateChange(value, customEndDate || '');
    } else {
      onCustomDateChange(customStartDate || '', value);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <h3 className={`text-sm font-medium text-gray-700 mb-3 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
        {t.selectPeriod}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
        <button
          onClick={() => onPeriodChange('today')}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            selectedPeriod === 'today'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t.today}
        </button>
        <button
          onClick={() => onPeriodChange('yesterday')}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            selectedPeriod === 'yesterday'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t.yesterday}
        </button>
        <button
          onClick={() => onPeriodChange('last7days')}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            selectedPeriod === 'last7days'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t.last7days}
        </button>
        <button
          onClick={() => onPeriodChange('last30days')}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            selectedPeriod === 'last30days'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t.last30days}
        </button>
        <button
          onClick={() => onPeriodChange('thisWeek')}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            selectedPeriod === 'thisWeek'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t.thisWeek}
        </button>
        <button
          onClick={() => onPeriodChange('thisMonth')}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            selectedPeriod === 'thisMonth'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t.thisMonth}
        </button>
        <button
          onClick={() => onPeriodChange('custom')}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            selectedPeriod === 'custom'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t.custom}
        </button>
      </div>
      {selectedPeriod === 'custom' && (
        <div className={`mt-4 grid grid-cols-2 gap-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              {t.startDate}
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={customStartDate}
              onChange={handleCustomDateChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              {t.endDate}
            </label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={customEndDate}
              onChange={handleCustomDateChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
}
