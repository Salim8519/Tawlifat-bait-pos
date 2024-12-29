import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguageStore();

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <Globe className="h-4 w-4 ml-2" />
        {language === 'ar' ? 'English' : 'العربية'}
      </button>
    </div>
  );
}