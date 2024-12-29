import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { LogOut, User } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguageStore } from '../../store/useLanguageStore';

export function Header() {
  const { user, logout } = useAuthStore();
  const { language } = useLanguageStore();

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {language === 'ar' ? 'نظام نقاط البيع' : 'POS System'}
        </h1>
        
        <div className="flex items-center space-x-4 space-x-reverse">
          <LanguageSwitcher />
          
          <div className="flex items-center space-x-2 space-x-reverse">
            <User className="w-5 h-5 text-gray-500" />
            <span className="text-gray-700">{user?.name}</span>
          </div>
          
          <button
            onClick={logout}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <LogOut className="w-4 h-4 ml-2" />
            {language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
          </button>
        </div>
      </div>
    </header>
  );
}