import React, { useState } from 'react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { cashDrawerTranslations } from '../../translations/cashDrawer';
import { useCashDrawerStore } from '../../store/useCashDrawerStore';

export function CashTransaction() {
  const { language } = useLanguageStore();
  const t = cashDrawerTranslations[language];
  const { addTransaction } = useCashDrawerStore();

  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !reason) return;

    addTransaction({
      type,
      amount: parseFloat(amount),
      reason,
      date: new Date().toISOString()
    });

    setShowForm(false);
    setAmount('');
    setReason('');
  };

  return (
    <>
      <button
        onClick={() => setShowForm(true)}
        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        {t.newTransaction}
      </button>

      {showForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">{t.newTransaction}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.transactionType}
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'deposit' | 'withdrawal')}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                >
                  <option value="deposit">{t.deposit}</option>
                  <option value="withdrawal">{t.withdrawal}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.amount}
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.reason}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>

              <div className="flex justify-end space-x-2 space-x-reverse">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  {t.confirm}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}