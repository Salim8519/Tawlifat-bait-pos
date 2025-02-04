import React, { useState, useEffect } from 'react';
import { Store, Package, TrendingUp, DollarSign } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { ProposedBusinessFilter } from '../components/vendor/ProposedBusinessFilter';
import { useAuthStore } from '../store/useAuthStore';
import { vendorDashboardTranslations } from '../translations/vendorDashboard';
import { getVendorAssignmentsByVendor } from '../services/vendorService';
import type { VendorAssignment } from '../types/vendor';

export function SubVendorDashboardPage() {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const t = vendorDashboardTranslations[language];
  
  const [assignments, setAssignments] = useState<VendorAssignment[]>([]);
  const [selectedBusinessCode, setSelectedBusinessCode] = useState<string | 'all'>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<VendorAssignment | null>(null);
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
      if (data.length > 0) {
        setSelectedAssignment(data[0]);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data - replace with actual API calls
  const stats = {
    totalProducts: 45,
    monthlyRevenue: 5678.90,
    activeProducts: 42,
    commission: 10
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
        <div className="flex items-center space-x-4 space-x-reverse w-full max-w-xl">
          <div className="flex-1 space-y-2">
            <ProposedBusinessFilter
              selectedBusinessCode={selectedBusinessCode}
              onBusinessChange={setSelectedBusinessCode}
              assignments={assignments}
              className="w-full"
            />
            {/* Branch Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.branch}
              </label>
              <select
                value={selectedAssignment?.branch_name || ''}
                onChange={(e) => {
                  if (e.target.value === 'all') {
                    setSelectedAssignment({
                      ...selectedAssignment!,
                      branch_name: 'all'
                    });
                  } else {
                    const assignment = assignments.find(a => 
                      a.owner_business_code === selectedBusinessCode && 
                      a.branch_name === e.target.value
                    );
                    if (assignment) {
                      setSelectedAssignment(assignment);
                    }
                  }
                }}
                className="w-full border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                disabled={selectedBusinessCode === 'all'}
              >
                <option value="all">{t.allBranches}</option>
                {selectedBusinessCode !== 'all' && 
                  assignments
                    .filter(a => a.owner_business_code === selectedBusinessCode)
                    .map(assignment => (
                      <option key={assignment.assignment_id} value={assignment.branch_name}>
                        {assignment.branch_name}
                      </option>
                    ))
                }
              </select>
            </div>
          </div>
        </div>
      </div>

      {selectedAssignment && (
        <>
          <div className={`border rounded-lg p-4 ${
            selectedBusinessCode === 'all' ? 'bg-gray-50 border-gray-100' : 'bg-indigo-50 border-indigo-100'
          }`}>
            <div className="flex items-center space-x-4 space-x-reverse">
              <Store className={`w-8 h-8 ${
                selectedBusinessCode === 'all' ? 'text-gray-600' : 'text-indigo-600'
              }`} />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedBusinessCode === 'all' 
                    ? t.allBusinesses 
                    : assignments.find(a => a.owner_business_code === selectedBusinessCode)?.owner_business_name
                  }
                </h2>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t.activeProducts}</p>
                  <h3 className="text-2xl font-bold">{stats.activeProducts}</h3>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t.monthlyRevenue}</p>
                  <h3 className="text-2xl font-bold">{stats.monthlyRevenue.toFixed(3)} {t.currency}</h3>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t.commission}</p>
                  <h3 className="text-2xl font-bold">{stats.commission}%</h3>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t.totalProducts}</p>
                  <h3 className="text-2xl font-bold">{stats.totalProducts}</h3>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts and tables will be added here */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">{t.latestSales}</h2>
              <p className="text-gray-500 text-center py-8">{t.noSalesData}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">{t.topProducts}</h2>
              <p className="text-gray-500 text-center py-8">{t.noProductsData}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}