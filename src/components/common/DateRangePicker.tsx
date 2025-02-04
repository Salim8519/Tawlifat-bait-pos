import React from 'react';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import { useLanguageStore } from '../../store/useLanguageStore';
import { Calendar } from 'lucide-react';

interface DateRangePickerProps {
  value: { from: Date; to: Date } | null;
  onChange: (value: { from: Date; to: Date } | null) => void;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  className = ''
}: DateRangePickerProps) {
  const { language } = useLanguageStore();
  const locale = language === 'ar' ? arSA : enUS;

  const formatDisplayDate = (date: Date) => {
    return format(date, 'dd/MM/yyyy', { locale });
  };

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fromDate = e.target.value ? new Date(e.target.value) : null;
    if (!fromDate) {
      onChange(null);
      return;
    }

    onChange({
      from: fromDate,
      to: value?.to || fromDate
    });
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const toDate = e.target.value ? new Date(e.target.value) : null;
    if (!toDate || !value?.from) {
      onChange(null);
      return;
    }

    onChange({
      from: value.from,
      to: toDate
    });
  };

  return (
    <div className={`flex gap-4 items-center ${language === 'ar' ? 'flex-row-reverse' : ''} ${className}`}>
      <Calendar className="w-5 h-5 text-gray-400" />
      
      <div className="flex flex-col">
        <label className="text-sm text-gray-600 mb-1">
          {language === 'ar' ? 'من' : 'From'}
        </label>
        <input
          type="date"
          value={value?.from ? format(value.from, 'yyyy-MM-dd') : ''}
          max={value?.to ? format(value.to, 'yyyy-MM-dd') : undefined}
          onChange={handleFromChange}
          className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          dir="ltr"
        />
        {value?.from && (
          <span className="text-sm text-gray-500 mt-1">
            {formatDisplayDate(value.from)}
          </span>
        )}
      </div>

      <div className="flex flex-col">
        <label className="text-sm text-gray-600 mb-1">
          {language === 'ar' ? 'إلى' : 'To'}
        </label>
        <input
          type="date"
          value={value?.to ? format(value.to, 'yyyy-MM-dd') : ''}
          min={value?.from ? format(value.from, 'yyyy-MM-dd') : undefined}
          onChange={handleToChange}
          className="border rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          dir="ltr"
        />
        {value?.to && (
          <span className="text-sm text-gray-500 mt-1">
            {formatDisplayDate(value.to)}
          </span>
        )}
      </div>
    </div>
  );
}
