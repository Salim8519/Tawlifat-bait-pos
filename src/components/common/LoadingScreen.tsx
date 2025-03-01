import React from 'react';
import { useLanguageStore } from '../../store/useLanguageStore';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Loading...'
}) => {
  const { language } = useLanguageStore();
  const isRTL = language === 'ar';

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-gray-600 text-lg">{message}</p>
    </div>
  );
};
