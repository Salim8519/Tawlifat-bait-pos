import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, User, Menu } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useLanguageStore } from '../../store/useLanguageStore';

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function Header({ onMenuClick, showMenuButton = false }: HeaderProps) {
  const { user } = useAuthStore();
  const { signOut } = useAuth();
  const { language } = useLanguageStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center">
          {showMenuButton && (
            <button
              id="sidebar-toggle"
              type="button"
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 mr-2 ml-2"
              onClick={onMenuClick}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>
          )}
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
            {language === 'ar' ? 'نظام نقاط البيع' : 'POS System'}
          </h1>
        </div>
        
        <div className="flex items-center space-x-4 space-x-reverse">
          <LanguageSwitcher />
          
          <div className="hidden sm:flex items-center space-x-2 space-x-reverse">
            <User className="w-5 h-5 text-gray-500" />
            <span className="text-gray-700">{user?.name}</span>
          </div>
          
          <button
            onClick={handleLogout}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <LogOut className="w-4 h-4 ml-2" />
            <span className="hidden sm:inline">{language === 'ar' ? 'تسجيل الخروج' : 'Logout'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}