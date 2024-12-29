import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { POSPage } from './pages/POSPage';
import { UpcomingProductsPage } from './pages/UpcomingProductsPage';
import { ProductsPage } from './pages/ProductsPage';
import { ReturnsPage } from './pages/ReturnsPage';
import { CustomersPage } from './pages/CustomersPage';
import { CashDrawerPage } from './pages/CashDrawerPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { BranchManagementPage } from './pages/BranchManagementPage';
import { CashiersPage } from './pages/CashiersPage';
import { SubVendorsPage } from './pages/SubVendorsPage';
import { RentalManagementPage } from './pages/RentalManagementPage';
import { CouponsPage } from './pages/CouponsPage';
import { DeveloperInfoPage } from './pages/DeveloperInfoPage';
import { AdminOwnersPage } from './pages/admin/AdminOwnersPage';
import { AdminCashiersPage } from './pages/admin/AdminCashiersPage';
import { SuperAdminPage } from './pages/admin/SuperAdminPage';
import { SubVendorDashboardPage } from './pages/SubVendorDashboardPage';
import { SubVendorProductsPage } from './pages/SubVendorProductsPage';
import { ReceiptsHistoryPage } from './pages/ReceiptsHistoryPage';
import { useAuthStore } from './store/useAuthStore';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const location = useLocation();
  
  if (!user) {
    // Redirect to login and save the attempted location
    return <Navigate to="/login" replace />;
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
      <Route path="/" element={<RequireAuth><DashboardLayout /></RequireAuth>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        {user?.role === 'super_admin' ? (<>
          <Route path="dashboard" element={<AdminOwnersPage />} />
          <Route path="cashiers" element={<AdminCashiersPage />} />
          <Route path="vendors" element={<SuperAdminPage />} />
        </>
        ) : user?.role === 'sub_vendor' ? (
          <>
            <Route path="dashboard" element={<SubVendorDashboardPage />} />
            <Route path="products" element={<SubVendorProductsPage />} />
          </>
        ) : (
          <>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="pos" element={<POSPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="upcoming-products" element={<UpcomingProductsPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="cash-drawer" element={<CashDrawerPage />} />
            <Route path="returns" element={<ReturnsPage />} />
            <Route path="receipts" element={<ReceiptsHistoryPage />} />
            <Route path="reports" element={<ReportsPage />} />
            {user?.role === 'owner' && (
              <>
                <Route path="cashiers" element={<CashiersPage />} />
                <Route path="sub-vendors" element={<SubVendorsPage />} />
                <Route path="rentals" element={<RentalManagementPage />} />
                <Route path="branches" element={<BranchManagementPage />} />
                <Route path="coupons" element={<CouponsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="developer" element={<DeveloperInfoPage />} />
              </>
            )}
          </>
        )}
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}