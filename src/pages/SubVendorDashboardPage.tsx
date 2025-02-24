import React, { useState, useEffect } from 'react';
import { Store } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { useAuthStore } from '../store/useAuthStore';
import { vendorDashboardTranslations } from '../translations/vendorDashboard';
import { getVendorAssignmentsByVendor } from '../services/vendorService';
import { VendorTransactionsTable } from '../components/vendor/VendorTransactionsTable';
import type { VendorAssignment } from '../types/vendor';

export function SubVendorDashboardPage() {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const t = vendorDashboardTranslations[language];
  
  const [assignments, setAssignments] = useState<VendorAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.businessCode) {
      loadAssignments();
    }
  }, [user?.businessCode]);

  const loadAssignments = async () => {
    try {
      setIsLoading(true);
      const data = await getVendorAssignmentsByVendor(user!.businessCode);
      setAssignments(data);
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">{t.loading}</p>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Store className="w-16 h-16 text-gray-400" />
        <p className="text-gray-500">{t.noAssignments}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.dashboard}</h1>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <VendorTransactionsTable vendorCode={user?.businessCode || ''} />
        </div>
      </div>
    </div>
  );
}