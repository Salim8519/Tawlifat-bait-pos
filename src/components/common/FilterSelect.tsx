import React from 'react';
import { useLanguageStore } from '../../store/useLanguageStore';

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  label: string;
  placeholder?: string;
}

export function FilterSelect({
  value,
  onChange,
  options,
  label,
  placeholder
}: FilterSelectProps) {
  const { language } = useLanguageStore();
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  return (
    <div className="flex flex-col gap-1" dir={dir}>
      <label className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
      >
        <option value="">{placeholder || (language === 'ar' ? 'الكل' : 'All')}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
