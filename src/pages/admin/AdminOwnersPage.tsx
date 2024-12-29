import React, { useState } from 'react';
import { Plus, Search, Store, AlertTriangle } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { adminTranslations } from '../../translations/admin';

interface StoreOwner {
  id: string;
  name: string;
  email: string;
  phone: string;
  storeCount: number;
  status: 'active' | 'suspended';
  joinDate: string;
  lastLogin: string | null;
}

export function AdminOwnersPage() {
  const { language } = useLanguageStore();
  const t = adminTranslations[language];
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOwner, setEditingOwner] = useState<StoreOwner | null>(null);

  // Mock data - replace with API calls
  const mockOwners: StoreOwner[] = [
    {
      id: '1',
      name: 'أحمد محمد',
      email: 'ahmed@store.com',
      phone: '96812345678',
      storeCount: 2,
      status: 'active',
      joinDate: '2024-01-01',
      lastLogin: '2024-03-15T10:30:00'
    },
    {
      id: '2',
      name: 'فاطمة علي',
      email: 'fatima@store.com',
      phone: '96887654321',
      storeCount: 1,
      status: 'suspended',
      joinDate: '2024-02-01',
      lastLogin: null
    }
  ];

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.storeOwners}</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center"
        >
          <Plus className="w-5 h-5 ml-2" />
          {t.addOwner}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchOwners}
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
                  {t.owner}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.contact}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.stores}
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
              {mockOwners.map((owner) => (
                <tr key={owner.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <Store className="h-6 w-6 text-indigo-600" />
                        </div>
                      </div>
                      <div className="mr-4">
                        <div className="text-sm font-medium text-gray-900">
                          {owner.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {owner.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {owner.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {owner.storeCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      owner.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {t[owner.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {owner.lastLogin 
                      ? new Date(owner.lastLogin).toLocaleDateString(
                          language === 'ar' ? 'ar' : 'en-US',
                          { dateStyle: 'medium' }
                        )
                      : t.never
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setEditingOwner(owner)}
                      className="text-indigo-600 hover:text-indigo-900 ml-4"
                    >
                      {t.edit}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(owner.status === 'active' ? t.confirmSuspend : t.confirmDelete)) {
                          // Handle status change
                          console.log('Changing owner status:', owner.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      {owner.status === 'active' ? t.suspend : t.delete}
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