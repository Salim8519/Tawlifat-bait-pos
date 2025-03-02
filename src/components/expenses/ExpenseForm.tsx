import React from 'react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { TransactionType, ExpenseFormData, PAYMENT_METHODS } from './types';

interface ExpenseFormProps {
  onSubmit: (data: ExpenseFormData) => void;
  selectedBranch: string | null;
}

export function ExpenseForm({ onSubmit, selectedBranch }: ExpenseFormProps) {
  const { language } = useLanguageStore();
  const [formData, setFormData] = React.useState<ExpenseFormData>({
    transaction_type: 'deposit',
    amount: 0,
    payment_method: 'cash',
    transaction_reason: '',
    branch_name: selectedBranch || '',
    details: {}
  });

  console.log('[ExpenseForm] Initialized with', { 
    selectedBranch, 
    initialFormData: formData 
  });

  React.useEffect(() => {
    console.log('[ExpenseForm] Branch changed in props', { selectedBranch });
    setFormData(prev => ({
      ...prev,
      branch_name: selectedBranch || ''
    }));
  }, [selectedBranch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[ExpenseForm] Form submitted', { 
      formData, 
      selectedBranch, 
      isValid: !!selectedBranch 
    });
    
    if (!selectedBranch) {
      console.error('[ExpenseForm] Cannot submit - no branch selected');
      return;
    }
    
    onSubmit(formData);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    console.log('[ExpenseForm] Input changed', { name, value });
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  console.log('[ExpenseForm] Rendering with', { 
    formData, 
    selectedBranch, 
    isSubmitDisabled: !selectedBranch 
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      {/* Transaction Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {language === 'ar' ? 'نوع المعاملة' : 'Transaction Type'}
        </label>
        <div className="flex gap-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="transaction_type"
              value="deposit"
              checked={formData.transaction_type === 'deposit'}
              onChange={handleInputChange}
              className="form-radio text-blue-600"
            />
            <span className="mr-2">
              {language === 'ar' ? 'إيداع' : 'Deposit'}
            </span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="transaction_type"
              value="withdraw"
              checked={formData.transaction_type === 'withdraw'}
              onChange={handleInputChange}
              className="form-radio text-blue-600"
            />
            <span className="mr-2">
              {language === 'ar' ? 'سحب' : 'Withdraw'}
            </span>
          </label>
        </div>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {language === 'ar' ? 'المبلغ' : 'Amount'}
        </label>
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleInputChange}
          min="0"
          step="0.001"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      {/* Payment Method */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}
        </label>
        <select
          name="payment_method"
          value={formData.payment_method}
          onChange={handleInputChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          {PAYMENT_METHODS.map(method => (
            <option key={method} value={method}>
              {language === 'ar' 
                ? method === 'cash' ? 'نقداً'
                  : method === 'card' ? 'بطاقة'
                  : 'اونلاين'
                : method}
            </option>
          ))}
        </select>
      </div>

      {/* Notes/Reason */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {language === 'ar' ? 'الملاحظات / السبب' : 'Notes / Reason'}
        </label>
        <textarea
          name="transaction_reason"
          value={formData.transaction_reason}
          onChange={handleInputChange}
          required
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={!selectedBranch}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
            ${selectedBranch 
              ? 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              : 'bg-gray-400 cursor-not-allowed'}`}
        >
          {language === 'ar' ? 'حفظ المعاملة' : 'Save Transaction'}
        </button>
      </div>
    </form>
  );
}
