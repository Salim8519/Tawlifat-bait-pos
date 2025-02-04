import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useBusinessStore } from '../../store/useBusinessStore';
import { getBranchesByBusinessCode } from '../../services/businessService';

export function DashboardLayout() {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const { setBranches } = useBusinessStore();

  useEffect(() => {
    if (user?.businessCode) {
      getBranchesByBusinessCode(user.businessCode).then(branches => {
        console.log('Fetched branches:', branches);
        setBranches(branches);
      }).catch(error => {
        console.error('Error fetching branches:', error);
      });
    }
  }, [user?.businessCode]);

  return (
    <div className="flex h-screen bg-gray-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}