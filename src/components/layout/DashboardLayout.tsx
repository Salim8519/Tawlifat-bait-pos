import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useBusinessStore } from '../../store/useBusinessStore';
import { getBranchesByBusinessCode } from '../../services/businessService';
import { Menu } from 'lucide-react';

export function DashboardLayout() {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const { setBranches } = useBusinessStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('mobile-sidebar');
      const toggleButton = document.getElementById('sidebar-toggle');
      
      if (sidebar && 
          !sidebar.contains(event.target as Node) && 
          toggleButton && 
          !toggleButton.contains(event.target as Node) &&
          sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen bg-gray-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Mobile sidebar */}
      <div 
        id="mobile-sidebar"
        className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
      >
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        <div className={`fixed inset-y-0 flex flex-col z-40 w-64 ${language === 'ar' ? 'right-0' : 'left-0'} bg-white shadow-xl`}>
          <Sidebar mobile={true} onCloseMobile={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="w-64">
          <Sidebar mobile={false} />
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          showMenuButton={true} 
        />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}