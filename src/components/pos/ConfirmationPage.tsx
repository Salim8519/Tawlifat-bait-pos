import React, { useState } from 'react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { posTranslations } from '../../translations/pos';
import type { PaymentMethod } from './PaymentMethods';

interface Props {
  total: number;
  paymentMethod: PaymentMethod;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationPage({ total, paymentMethod, onConfirm, onCancel }: Props) {
  const { language } = useLanguageStore();
  const t = posTranslations[language];
  const [cashConfirmed, setCashConfirmed] = useState(false);

  const handleConfirm = () => {
    if (paymentMethod === 'cash' && !cashConfirmed) {
      alert(t.confirmCashRequired);
      return;
    }
    onConfirm();
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4">
          {t.confirmPayment}
        </h2>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">{t.total}:</span>
            <span className="text-xl font-bold">
              {total.toFixed(3)} {t.currency}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-700">{t.paymentMethod}:</span>
            <span className="font-medium">
              {paymentMethod === 'cash' ? t.cashPayment :
               paymentMethod === 'credit' ? t.creditPayment :
               t.onlinePayment}
            </span>
          </div>

          {paymentMethod === 'cash' && (
            <div className="border-t pt-4">
              <label className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="checkbox"
                  checked={cashConfirmed}
                  onChange={(e) => setCashConfirmed(e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  {t.confirmCashMessage}
                </span>
              </label>
            </div>
          )}

          <div className="flex justify-end space-x-2 space-x-reverse pt-4 border-t">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleConfirm}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {t.confirm}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}