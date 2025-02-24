import { CalendarDays } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { startOfDay, subDays, subMonths, format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export type Period = 'day' | 'week' | 'month' | '3months' | 'custom';

interface PeriodSelectorProps {
  selectedPeriod: Period;
  onPeriodChange: (period: Period) => void;
  onCustomDateChange?: (startDate: string, endDate: string) => void;
  customStartDate?: string;
  customEndDate?: string;
}

export function PeriodSelector({
  selectedPeriod,
  onPeriodChange,
  onCustomDateChange,
  customStartDate,
  customEndDate
}: PeriodSelectorProps) {
  const { language } = useLanguageStore();
  const isRTL = language === 'ar';
  const locale = isRTL ? ar : enUS;

  const translations = {
    day: isRTL ? 'اليوم' : 'Today',
    week: isRTL ? 'الأسبوع' : 'Week',
    month: isRTL ? 'الشهر' : 'Month',
    '3months': isRTL ? '3 أشهر' : '3 Months',
    custom: isRTL ? 'مخصص' : 'Custom',
    from: isRTL ? 'من' : 'From',
    to: isRTL ? 'إلى' : 'To'
  };

  const handleCustomDateChange = (startDate: string, endDate: string) => {
    if (onCustomDateChange) {
      onCustomDateChange(startDate, endDate);
    }
  };

  return (
    <div className="flex flex-wrap gap-3" dir={isRTL ? 'rtl' : 'ltr'}>
      {(['day', 'week', 'month', '3months', 'custom'] as Period[]).map((period) => (
        <button
          key={period}
          onClick={() => onPeriodChange(period)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
            selectedPeriod === period
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {period === 'custom' && <CalendarDays className="w-4 h-4" />}
          {translations[period]}
        </button>
      ))}
      
      {selectedPeriod === 'custom' && (
        <div className="flex gap-3 items-center">
          <input
            type="date"
            value={customStartDate}
            onChange={(e) => handleCustomDateChange(e.target.value, customEndDate || '')}
            className="px-3 py-1.5 rounded-lg text-sm border border-gray-200"
          />
          <span className="text-sm text-gray-500">{translations.to}</span>
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => handleCustomDateChange(customStartDate || '', e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm border border-gray-200"
          />
        </div>
      )}
    </div>
  );
}
