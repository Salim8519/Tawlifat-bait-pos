import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ToastNotificationProps {
  visible: boolean;
  message: string;
  subMessage: string;
  onAction: () => void;
  onIgnore: () => void;
  actionText: string;
  language: 'en' | 'ar';
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  visible,
  message,
  subMessage,
  onAction,
  onIgnore,
  actionText,
  language
}) => {
  return (
    <div
      className={`${visible ? 'animate-enter' : 'animate-leave'}
        max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto
        flex ring-1 ring-black ring-opacity-5`}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="flex-1 p-3">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
          </div>
          <div className={`${language === 'ar' ? 'mr-2' : 'ml-2'} flex-1`}>
            <p className="text-sm font-medium text-gray-900">
              {message}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {subMessage}
            </p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={onAction}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-500 
                       px-2 py-1 rounded hover:bg-indigo-50"
            >
              {actionText}
            </button>
            <button
              onClick={onIgnore}
              className="text-gray-400 hover:text-gray-500"
              title={language === 'ar' ? 'تجاهل' : 'Ignore'}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
