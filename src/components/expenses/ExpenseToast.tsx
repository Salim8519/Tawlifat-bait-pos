import React from 'react';
import { useLanguageStore } from '../../store/useLanguageStore';

interface ExpenseToastProps {
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}

export function ExpenseToast({ type, message, onClose }: ExpenseToastProps) {
  const { language } = useLanguageStore();
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white flex items-center gap-2 z-50`}>
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-white hover:text-gray-200 focus:outline-none"
      >
        ✕
      </button>
    </div>
  );
}
