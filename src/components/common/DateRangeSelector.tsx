import React from 'react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { dashboardTranslations } from '../../translations/dashboard';

export type DateRangePeriod = 'day' | 'week' | 'month' | '3months' | 'custom';

interface DateRangeSelectorProps {
  selectedPeriod: DateRangePeriod;
  onPeriodChange: (period: DateRangePeriod) => void;
  onCustomDateChange: (startDate: string, endDate: string) => void;
  customStartDate?: string;
  customEndDate?: string;
}

export function DateRangeSelector({
  selectedPeriod,
  onPeriodChange,
  onCustomDateChange,
  customStartDate,
  customEndDate
}: DateRangeSelectorProps) {
  const { language } = useLanguageStore();
  const t = dashboardTranslations[language];

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
      <h3 className="text-sm font-medium text-gray-700 mb-3">{t.selectPeriod}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <button
          onClick={() => onPeriodChange('day')}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            selectedPeriod === 'day'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t.today}
        </button>
        <button
          onClick={() => onPeriodChange('week')}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            selectedPeriod === 'week'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t.thisWeek}
        </button>
        <button
          onClick={() => onPeriodChange('month')}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            selectedPeriod === 'month'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t.thisMonth}
        </button>
        <button
          onClick={() => onPeriodChange('3months')}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            selectedPeriod === '3months'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t.last3Months}
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
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              {t.startDate}
            </label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={customStartDate || ''}
              onChange={handleCustomDateChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
              dir="ltr"
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
              value={customEndDate || ''}
              onChange={handleCustomDateChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 bg-white"
              dir="ltr"
            />
          </div>
        </div>
      )}
    </div>
  );
}
