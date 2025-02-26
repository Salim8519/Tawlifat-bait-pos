import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { useAuthStore } from '../store/useAuthStore';
import { vendorDashboardTranslations } from '../translations/vendorDashboard';
import { VendorTransactionsTable } from '../components/vendor/VendorTransactionsTable';

export function SubVendorReportsPage() {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const t = vendorDashboardTranslations[language];
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Add a small delay to ensure all data is loaded
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Debug user object
  useEffect(() => {
    console.log('User in SubVendorReportsPage:', user);
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">{t.loading}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">User not authenticated</p>
      </div>
    );
  }

  if (!user.businessCode) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">{t.noBusinessCode || 'No business code found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.reports || 'Reports'}</h1>
      </div>

      {/* Detailed Transaction Reports */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <FileText className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0 text-blue-500" />
            <h2 className="text-lg font-medium">{t.detailedTransactions || 'Detailed Transactions'}</h2>
          </div>
          <VendorTransactionsTable vendorCode={user.businessCode} />
        </div>
      </div>
    </div>
  );
}
