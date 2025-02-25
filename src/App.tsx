import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { useBusinessSettings } from './hooks/useBusinessSettings';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { POSPage } from './pages/POSPage';
import { UpcomingProductsPage } from './pages/UpcomingProductsPage';
import { ProductsPage } from './pages/ProductsPage';
import { ReturnProductsPage } from './pages/ReturnProductsPage';
// import { ReturnsPage } from './pages/ReturnsPage';
import { CustomersPage } from './pages/CustomersPage';
import { CashDrawerPage } from './pages/CashDrawerPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { VendorSettingsPage } from './pages/VendorSettingsPage';
import { BranchManagementPage } from './pages/BranchManagementPage';
import { CashiersPage } from './pages/CashiersPage';
import { ManagersPage } from './pages/ManagersPage';
import { SubVendorsPage } from './pages/SubVendorsPage';
import { CouponsPage } from './pages/CouponsPage';
import { DeveloperInfoPage } from './pages/DeveloperInfoPage';
import { AdminOwnersPage } from './pages/admin/AdminOwnersPage';
import { AdminCashiersPage } from './pages/admin/AdminCashiersPage';
import { SuperAdminPage } from './pages/admin/SuperAdminPage';
import { SubVendorDashboardPage } from './pages/SubVendorDashboardPage';
import { SubVendorProductsPage } from './pages/SubVendorProductsPage';
import { ReceiptsHistoryPage } from './pages/ReceiptsHistoryPage';
import { VendorProfitsPage } from './pages/VendorProfitsPage';
import MonthlyVendorTaxesPage from './pages/MonthlyVendorTaxesPage';
import { VendorSpacesPage } from './pages/VendorSpacesPage';
import { BarcodePrintSettingsPage } from './pages/BarcodePrintSettingsPage';
import { useAuthStore } from './store/useAuthStore';
import { useLanguageStore } from './store/useLanguageStore';
import { useBusinessStore } from './store/useBusinessStore';
import { startProductMonitoring, stopProductMonitoring } from './services/productMonitorService';
import { Toaster } from 'react-hot-toast';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { UpdatePasswordPage } from './pages/UpdatePasswordPage';
import ExpensesPage from './pages/ExpensesPage';
import './i18n';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const { settings, isLoading } = useBusinessSettings();
  const location = useLocation();
  
  if (!user) {
    // Redirect to login and save the attempted location
    return <Navigate to="/login" replace />;
  }

  // Wait for settings to load
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
      <p className="text-gray-500">Loading settings...</p>
    </div>;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuthStore();
  const location = useLocation();

  // Redirect to login if on root path and not authenticated
  if (location.pathname === '/' && !user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/update-password" element={<UpdatePasswordPage />} />
      <Route path="/" element={<RequireAuth><DashboardLayout /></RequireAuth>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        {(user?.role === 'super_admin' || user?.role === 'admin') ? (
          <>
            <Route path="dashboard" element={<AdminOwnersPage />} />
            <Route path="cashiers" element={<AdminCashiersPage />} />
            <Route path="vendors" element={<SuperAdminPage />} />
          </>
        ) : user?.role === 'vendor' ? (
          <>
            <Route path="dashboard" element={<SubVendorDashboardPage />} />
            <Route path="products" element={<SubVendorProductsPage />} />
            <Route path="settings" element={<VendorSettingsPage />} />
          </>
        ) : (
          <>
            <Route path="pos" element={<POSPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="upcoming-products" element={<UpcomingProductsPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="cash-drawer" element={<CashDrawerPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="return-products" element={<ReturnProductsPage />} />
            <Route path="receipts" element={<ReceiptsHistoryPage />} />
            
            {(user?.role === 'owner' || user?.role === 'manager') && (
              <>
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="cashiers" element={<CashiersPage />} />
                <Route path="managers" element={<ManagersPage />} />
                <Route path="sub-vendors" element={<SubVendorsPage />} />
                <Route path="vendor-profits" element={<VendorProfitsPage />} />
                <Route path="monthly-vendor-taxes" element={<MonthlyVendorTaxesPage />} />
                <Route path="vendor-spaces" element={<VendorSpacesPage />} />
                <Route path="branches" element={<BranchManagementPage />} />
                <Route path="coupons" element={<CouponsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="barcode-settings" element={<BarcodePrintSettingsPage />} />
                <Route path="developer" element={<DeveloperInfoPage />} />
              </>
            )}
            <Route path="vendor-profits" element={<VendorProfitsPage />} />
          </>
        )}
      </Route>
    </Routes>
  );
}

export default function App() {
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const { getCurrentBranch } = useBusinessStore();
  
  useEffect(() => {
    if (user?.businessCode) {
      // For cashiers, use their assigned main_branch from profile
      const branchName = user.role === 'cashier' ? user.main_branch : undefined;
      
      // Start monitoring for new products
      startProductMonitoring(
        user.businessCode,
        user.role,
        branchName,
        language
      );
      
      console.log('Started monitoring for business:', user.businessCode, 'branch:', branchName); // Debug log
    }
    
    return () => {
      stopProductMonitoring();
      console.log('Stopped monitoring'); // Debug log
    };
  }, [user?.businessCode, user?.role, user?.main_branch, language]);

  return (
    <>
      <Toaster position={language === 'ar' ? 'top-left' : 'top-right'} />
      <Router>
        <AppRoutes />
      </Router>
    </>
  );
}