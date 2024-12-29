import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { UserBranchSelector } from '../branch/UserBranchSelector';
import { useLanguageStore } from '../../store/useLanguageStore';
import { StoreOwnerSelector } from '../vendor/StoreOwnerSelector';
import { VendorStoreSelector } from '../vendor/VendorStoreSelector';
import { useAuthStore } from '../../store/useAuthStore';

export function DashboardLayout() {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();

  return (
    <div className="flex h-screen bg-gray-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        {(user?.role === 'owner' || user?.role === 'cashier') && (
          <UserBranchSelector />
        )}
        {user?.role === 'sub_vendor' && (
          <div className="bg-white border-b px-4 py-2">
            <div className="flex items-center justify-end space-x-4 space-x-reverse">
              <StoreOwnerSelector />
              <VendorStoreSelector />
            </div>
          </div>
        )}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}