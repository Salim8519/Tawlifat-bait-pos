import React from 'react';
import { Search } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { productTranslations } from '../../translations/products';

interface Props {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterType: 'all' | 'food' | 'non-food';
  onFilterChange: (type: 'all' | 'food' | 'non-food') => void;
}

export function ProductFilters({ searchQuery, onSearchChange, filterType, onFilterChange }: Props) {
  const { language } = useLanguageStore();
  const t = productTranslations[language];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="relative">
        <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t.searchProduct}
          className="w-full pr-10 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        />
      </div>
      <div className="flex items-center space-x-4 space-x-reverse">
        <select
          value={filterType}
          onChange={(e) => onFilterChange(e.target.value as typeof filterType)}
          className="border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        >
          <option value="all">{t.allProducts}</option>
          <option value="food">{t.foodProducts}</option>
          <option value="non-food">{t.nonFoodProducts}</option>
        </select>
      </div>
    </div>
  );
}