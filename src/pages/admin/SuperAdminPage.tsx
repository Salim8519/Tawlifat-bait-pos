import React, { useState } from 'react';
import { Plus, Search, Store, AlertTriangle } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { superAdminTranslations } from '../../translations/superAdmin';

interface MainVendor {
  id: string;
  storeName: string;
  ownerName: string;
  username: string;
  email: string;
  phone: string;
  location: string;
  status: 'active' | 'suspended' | 'inactive';
  joinDate: string;
  lastLogin: string | null;
  subVendorsCount: number;
  cashiersCount: number;
}

export function SuperAdminPage() {
  const { language } = useLanguageStore();
  const t = superAdminTranslations[language];
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<MainVendor | null>(null);

  // Mock data - replace with API calls
  const mockVendors: MainVendor[] = [
    {
      id: '1',
      storeName: 'سوبرماركت السعادة',
      ownerName: 'أحمد محمد',
      username: 'ahmed_store',
      email: 'ahmed@store.com',
      phone: '96812345678',
      location: 'مسقط، عمان',
      status: 'active',
      joinDate: '2024-01-01',
      lastLogin: '2024-03-15T10:30:00',
      subVendorsCount: 5,
      cashiersCount: 8
    },
    {
      id: '2',
      storeName: 'متجر البركة',
      ownerName: 'فاطمة علي',
      username: 'fatima_store',
      email: 'fatima@store.com',
      phone: '96887654321',
      location: 'صلالة، عمان',
      status: 'suspended',
      joinDate: '2024-02-01',
      lastLogin: null,
      subVendorsCount: 2,
      cashiersCount: 3
    }
  ];

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.superAdmin}</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center"
        >
          <Plus className="w-5 h-5 ml-2" />
          {t.addVendor}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-indigo-100 p-3 rounded-full">
              <Store className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="mr-4">
              <h3 className="text-lg font-semibold">{t.totalVendors}</h3>
              <p className="text-3xl font-bold mt-1">{mockVendors.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <Store className="w-6 h-6 text-green-600" />
            </div>
            <div className="mr-4">
              <h3 className="text-lg font-semibold">{t.activeVendors}</h3>
              <p className="text-3xl font-bold mt-1">
                {mockVendors.filter(v => v.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-red-100 p-3 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="mr-4">
              <h3 className="text-lg font-semibold">{t.suspendedVendors}</h3>
              <p className="text-3xl font-bold mt-1">
                {mockVendors.filter(v => v.status === 'suspended').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchVendor}
              className="w-full pr-10 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.vendor}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.location}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.subVendorsCount}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.status}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.lastLogin}
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">{t.actions}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockVendors.map((vendor) => (
                <tr key={vendor.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <Store className="h-6 w-6 text-indigo-600" />
                        </div>
                      </div>
                      <div className="mr-4">
                        <div className="text-sm font-medium text-gray-900">
                          {vendor.storeName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {vendor.ownerName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{vendor.location}</div>
                    <div className="text-sm text-gray-500">{vendor.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {vendor.subVendorsCount} {language === 'ar' ? 'مورد' : 'vendors'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {vendor.cashiersCount} {language === 'ar' ? 'كاشير' : 'cashiers'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      vendor.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {t[vendor.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vendor.lastLogin 
                      ? new Date(vendor.lastLogin).toLocaleDateString(
                          language === 'ar' ? 'ar' : 'en-US',
                          { dateStyle: 'medium' }
                        )
                      : t.never
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setEditingVendor(vendor)}
                      className="text-indigo-600 hover:text-indigo-900 ml-4"
                    >
                      {t.edit}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(vendor.status === 'active' ? t.confirmSuspend : t.confirmDelete)) {
                          // Handle status change
                          console.log('Changing vendor status:', vendor.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      {vendor.status === 'active' ? t.suspend : t.delete}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}