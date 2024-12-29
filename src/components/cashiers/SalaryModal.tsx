import React from 'react';
import { useLanguageStore } from '../../store/useLanguageStore'; 
import { cashierTranslations } from '../../translations/cashiers';
import { DollarSign, Calculator } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SalaryData) => void;
  initialData?: SalaryData;
}

export interface SalaryData {
  basicSalary: number;
  bonus: number;
  deductions: number;
  notes?: string;
  paymentDate: string;
}

export function SalaryModal({ isOpen, onClose, onSubmit, initialData }: Props) {
  const { language } = useLanguageStore();
  const t = cashierTranslations[language];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      basicSalary: parseFloat(formData.get('basicSalary') as string),
      bonus: parseFloat(formData.get('bonus') as string) || 0,
      deductions: parseFloat(formData.get('deductions') as string) || 0,
      notes: formData.get('notes') as string,
      paymentDate: formData.get('paymentDate') as string,
    });
  };

  if (!isOpen) return null;

  const calculateTotal = (basic: number, bonus: number, deductions: number) => {
    return basic + bonus - deductions;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const form = e.target.form;
    if (!form) return;

    const basicSalary = parseFloat(form.basicSalary.value) || 0;
    const bonus = parseFloat(form.bonus.value) || 0;
    const deductions = parseFloat(form.deductions.value) || 0;
    const total = calculateTotal(basicSalary, bonus, deductions);

    const totalElement = form.querySelector('#total-salary');
    if (totalElement) {
      totalElement.textContent = total.toFixed(3);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center space-x-2 space-x-reverse mb-6">
          <div className="bg-indigo-100 p-2 rounded-full">
            <DollarSign className="w-6 h-6 text-indigo-600" />
          </div>
          <h2 className="text-xl font-semibold">
            {initialData ? t.editSalary : t.addSalary}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.basicSalary} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                name="basicSalary"
                defaultValue={initialData?.basicSalary}
                onChange={handleInputChange}
                required
                min="0"
                step="0.001"
                className="w-full pl-3 pr-12 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                dir="ltr"
              />
              <span className="absolute left-3 top-2 text-gray-500">{t.currency}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.bonus}
            </label>
            <div className="relative">
              <input
                type="number"
                name="bonus"
                defaultValue={initialData?.bonus}
                onChange={handleInputChange}
                min="0"
                step="0.001"
                className="w-full pl-3 pr-12 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                dir="ltr"
              />
              <span className="absolute left-3 top-2 text-gray-500">{t.currency}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.deductions}
            </label>
            <div className="relative">
              <input
                type="number"
                name="deductions"
                defaultValue={initialData?.deductions}
                onChange={handleInputChange}
                min="0"
                step="0.001"
                className="w-full pl-3 pr-12 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                dir="ltr"
              />
              <span className="absolute left-3 top-2 text-gray-500">{t.currency}</span>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 space-x-reverse">
                <Calculator className="w-5 h-5 text-gray-500" />
                <span className="font-medium">{t.totalSalary}:</span>
              </div>
              <div className="text-xl font-bold text-indigo-600">
                <span id="total-salary">
                  {calculateTotal(
                    initialData?.basicSalary || 0,
                    initialData?.bonus || 0,
                    initialData?.deductions || 0
                  ).toFixed(3)}
                </span>
                <span className="mr-1 text-sm">{t.currency}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.paymentDate} <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="paymentDate"
              defaultValue={initialData?.paymentDate}
              required
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.notes}
            </label>
            <textarea
              name="notes"
              defaultValue={initialData?.notes}
              rows={3}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>

          <div className="flex justify-end space-x-2 space-x-reverse">
            <button
              type="button"
              onClick={onClose}
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