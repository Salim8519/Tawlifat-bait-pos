import React, { useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { posTranslations } from '../../translations/pos';
import { CustomerForm } from './CustomerForm';
import type { Customer } from '../../types/pos';

interface CustomerSearchProps {
  onCustomerSelect: (customer: Customer) => void;
  onAddNewCustomer: (customer: Omit<Customer, 'id'>) => void;
}

export function CustomerSearch({ onCustomerSelect, onAddNewCustomer }: CustomerSearchProps) {
  const { language } = useLanguageStore();
  const t = posTranslations[language];
  const [phone, setPhone] = useState('');
  const [showAddNew, setShowAddNew] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSearch = async () => {
    // Simulate customer search
    const customer = mockCustomers.find(c => c.phone === phone);
    if (customer) {
      onCustomerSelect(customer);
      setShowAddNew(false);
    } else {
      setShowAddNew(true);
    }
  };

  const handleAddCustomer = (customer: Omit<Customer, 'id'>) => {
    onAddNewCustomer(customer);
    setShowForm(false);
    setShowAddNew(false);
  };

  return (
    <div className="p-4 border-b">
      <div className="flex space-x-2 space-x-reverse">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="tel"
            placeholder={t.customerPhone}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full pr-10 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {t.search}
        </button>
      </div>

      {showAddNew && (
        <div className="mt-2 flex items-center justify-between p-2 bg-yellow-50 rounded-md">
          <span className="text-sm text-yellow-800">{t.customerNotFound}</span>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
          >
            <UserPlus className="w-4 h-4 ml-1" />
            {t.addNewCustomer}
          </button>
        </div>
      )}

      {showForm && (
        <CustomerForm
          onSubmit={handleAddCustomer}
          onCancel={() => setShowForm(false)}
          initialPhone={phone}
        />
      )}
    </div>
  );
}

// Mock data - replace with actual API calls
const mockCustomers: Customer[] = [
  { id: '1', name: 'أحمد محمد', phone: '96812345678', points: 100 },
  { id: '2', name: 'فاطمة علي', phone: '96887654321', points: 50 },
];