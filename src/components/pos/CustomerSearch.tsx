import React, { useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useAuthStore } from '../../store/useAuthStore';
import { posTranslations } from '../../translations/pos';
import { CustomerForm } from './CustomerForm';
import { getCustomerByPhone, createCustomer } from '../../services/customerService';
import type { Customer } from '../../types/pos';

interface CustomerSearchProps {
  onCustomerSelect: (customer: Customer | null) => void;
}

export function CustomerSearch({ onCustomerSelect }: CustomerSearchProps) {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const t = posTranslations[language];
  const [phone, setPhone] = useState('');
  const [showAddNew, setShowAddNew] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!phone) return;
    
    setIsSearching(true);
    setError(null);
    setShowAddNew(false);

    try {
      const customer = await getCustomerByPhone(phone, user!.businessCode);
      if (customer) {
        // Convert the customer data to match the expected format
        onCustomerSelect({
          id: customer.customer_id!,
          name: customer.customer_name,
          phone: customer.phone_number,
          points: 0
        });
        setPhone(''); // Clear the input after successful selection
      } else {
        // Clear the previously selected customer when no match is found
        onCustomerSelect(null);
        setShowAddNew(true);
      }
    } catch (err) {
      console.error('Error searching customer:', err);
      setError(t.errorSearchingCustomer);
      // Also clear the customer on error
      onCustomerSelect(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddCustomer = async (customerData: Omit<Customer, 'customer_id'>) => {
    try {
      setError(null);
      const newCustomer = await createCustomer({
        ...customerData,
        business_code: user!.businessCode,
        number_of_orders: 0
      });
      
      // Convert the new customer data to match the expected format
      onCustomerSelect({
        id: newCustomer.customer_id!,
        name: newCustomer.customer_name,
        phone: newCustomer.phone_number,
        points: 0
      });
      
      setShowForm(false);
      setShowAddNew(false);
      setPhone(''); // Clear the input after successful creation
    } catch (err) {
      console.error('Error creating customer:', err);
      setError(t.errorCreatingCustomer);
    }
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
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pr-10 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={isSearching || !phone}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSearching ? t.searching : t.search}
        </button>
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}

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