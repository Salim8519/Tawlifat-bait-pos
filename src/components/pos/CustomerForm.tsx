import React from 'react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { posTranslations } from '../../translations/pos';
import type { Customer } from '../../types/pos';

interface Props {
  onSubmit: (customer: Omit<Customer, 'id'>) => void;
  onCancel: () => void;
  initialPhone?: string;
}

export function CustomerForm({ onSubmit, onCancel, initialPhone }: Props) {
  const { language } = useLanguageStore();
  const t = posTranslations[language];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      name: formData.get('name') as string,
      phone: formData.get('phone') as string,
      points: 0
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{t.addNewCustomer}</h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-500"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.customerName} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              autoFocus
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.customerPhone} <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              defaultValue={initialPhone}
              required
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              dir="ltr"
            />
          </div>

          <div className="flex justify-end space-x-2 space-x-reverse">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}