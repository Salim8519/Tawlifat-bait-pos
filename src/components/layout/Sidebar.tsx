import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  ShoppingCart, 
  DollarSign,
  Package, 
  Users, 
  BarChart, 
  Settings,
  Store,
  UserCog,
  Truck,
  Receipt,
  Building2,
  Tags,
  Ticket,
  Code,
  ShieldCheck,
  ArrowLeftRight,
  TrendingUp,
  LayoutGrid,
  Wallet,
  Printer,
  X,
  Building
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useLanguageStore } from '../../store/useLanguageStore';

interface SidebarProps {
  mobile?: boolean;
  onCloseMobile?: () => void;
}

const NavItem = ({ to, icon: Icon, children, onClick }: { to: string; icon: any; children: React.ReactNode; onClick?: () => void }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center space-x-2 space-x-reverse px-4 py-3 rounded-md transition-colors ${
        isActive
          ? 'bg-indigo-500 text-white'
          : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
      }`
    }
  >
    <Icon className="w-5 h-5" />
    <span>{children}</span>
  </NavLink>
);

export function Sidebar({ mobile = false, onCloseMobile }: SidebarProps) {
  const { user } = useAuthStore();
  const { language } = useLanguageStore();

  const handleNavClick = () => {
    if (mobile && onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <aside className="flex flex-col h-full bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-4 flex-1">
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center">
            <Store className="w-8 h-8 text-indigo-600" />
            <span className="mr-2 text-xl font-bold text-gray-900">
              {language === 'ar' ? 'متجري' : 'My Store'}
            </span>
          </div>
          
          {mobile && onCloseMobile && (
            <button 
              onClick={onCloseMobile}
              className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <nav className="mt-8 space-y-2">
          {user?.role === 'admin' ? (
            <>
              <NavItem to="/dashboard" icon={ShieldCheck} onClick={handleNavClick}>
                {language === 'ar' ? 'أصحاب المتاجر' : 'Store Owners'}
              </NavItem>
              <NavItem to="/cashiers" icon={Users} onClick={handleNavClick}>
                {language === 'ar' ? 'الكاشير' : 'Cashiers'}
              </NavItem>
              <NavItem to="/vendors" icon={Store} onClick={handleNavClick}>
                {language === 'ar' ? 'الموردين' : 'Vendors'}
              </NavItem>
            </>
          ) : user?.role === 'vendor' ? (
            <>
              <NavItem to="/dashboard" icon={Home} onClick={handleNavClick}>
                {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
              </NavItem>
              <NavItem to="/products" icon={Package} onClick={handleNavClick}>
                {language === 'ar' ? 'منتجاتي' : 'My Products'}
              </NavItem>
              <NavItem to="/reports" icon={BarChart} onClick={handleNavClick}>
                {language === 'ar' ? 'التقارير' : 'Reports'}
              </NavItem>
              <NavItem to="/rentals" icon={Building} onClick={handleNavClick}>
                {language === 'ar' ? 'إيجاراتي' : 'My Rentals'}
              </NavItem>
              <NavItem to="/settings" icon={Settings} onClick={handleNavClick}>
                {language === 'ar' ? 'الإعدادات' : 'Settings'}
              </NavItem>
            </>
          ) : (
            <>
              {(user?.role === 'owner' || user?.role === 'manager') && (
                <>
                  <NavItem to="/dashboard" icon={Home} onClick={handleNavClick}>
                    {language === 'ar' ? 'الرئيسية' : 'Dashboard'}
                  </NavItem>
                  <NavItem to="/reports" icon={BarChart} onClick={handleNavClick}>
                    {language === 'ar' ? 'التقارير' : 'Reports'}
                  </NavItem>
                </>
              )}
              <NavItem to="/pos" icon={ShoppingCart} onClick={handleNavClick}>
                {language === 'ar' ? 'نقطة البيع' : 'POS'}
              </NavItem>
              <NavItem to="/products" icon={Package} onClick={handleNavClick}>
                {language === 'ar' ? 'المنتجات' : 'Products'}
              </NavItem>
              <NavItem to="/upcoming-products" icon={Package} onClick={handleNavClick}>
                {language === 'ar' ? 'المنتجات القادمة' : 'Upcoming Products'}
              </NavItem>
              <NavItem to="/customers" icon={Users} onClick={handleNavClick}>
                {language === 'ar' ? 'العملاء' : 'Customers'}
              </NavItem>
              <NavItem to="/cash-drawer" icon={DollarSign} onClick={handleNavClick}>
                {language === 'ar' ? 'درج النقود' : 'Cash Drawer'}
              </NavItem>
              <NavItem to="/expenses" icon={Wallet} onClick={handleNavClick}>
                {language === 'ar' ? 'المصروفات العامة' : 'General Expenses'}
              </NavItem>
              <NavItem to="/return-products" icon={ArrowLeftRight} onClick={handleNavClick}>
                {language === 'ar' ? 'إرجاع المنتجات' : 'Return Products'}
              </NavItem>
              <NavItem to="/receipts" icon={Receipt} onClick={handleNavClick}>
                {language === 'ar' ? 'الفواتير' : 'Receipts'}
              </NavItem>
              
              {(user?.role === 'owner' || user?.role === 'manager') && (
                <>
                  <div className="pt-4 mb-2 border-t">
                    <p className="px-4 text-xs font-semibold text-gray-500 uppercase">
                      {language === 'ar' ? 'الإدارة' : 'Management'}
                    </p>
                  </div>
                  <NavItem to="/cashiers" icon={UserCog} onClick={handleNavClick}>
                    {language === 'ar' ? 'الكاشير' : 'Cashiers'}
                  </NavItem>
                  <NavItem to="/managers" icon={UserCog} onClick={handleNavClick}>
                    {language === 'ar' ? 'المدراء' : 'Managers'}
                  </NavItem>
                  <NavItem to="/sub-vendors" icon={Users} onClick={handleNavClick}>
                    {language === 'ar' ? 'إدارة الموردين' : 'Sub-vendors'}
                  </NavItem>
                  <NavItem to="/branches" icon={Building2} onClick={handleNavClick}>
                    {language === 'ar' ? 'الفروع' : 'Branches'}
                  </NavItem>
                  <NavItem to="/vendor-profits" icon={TrendingUp} onClick={handleNavClick}>
                    {language === 'ar' ? 'أرباح الموردين' : 'Vendor Profits'}
                  </NavItem>
                  <NavItem to="/monthly-vendor-taxes" icon={DollarSign} onClick={handleNavClick}>
                    {language === 'ar' ? 'الضرائب الشهرية للموردين' : 'Monthly Vendor Taxes'}
                  </NavItem>
                  <NavItem to="/vendor-spaces" icon={LayoutGrid} onClick={handleNavClick}>
                    {language === 'ar' ? 'مساحات الموردين' : 'Vendor Spaces'}
                  </NavItem>
                  <NavItem to="/coupons" icon={Ticket} onClick={handleNavClick}>
                    {language === 'ar' ? 'الكوبونات' : 'Coupons'}
                  </NavItem>
                  <NavItem to="/settings" icon={Settings} onClick={handleNavClick}>
                    {language === 'ar' ? 'الإعدادات' : 'Settings'}
                  </NavItem>
                  <NavItem to="/developer" icon={Code} onClick={handleNavClick}>
                    {language === 'ar' ? 'المطور' : 'Developer'}
                  </NavItem>
                </>
              )}
              
              {(user?.role === 'owner' || user?.role === 'manager' || user?.role === 'cashier') && (
                <NavItem to="/barcode-settings-v2" icon={Printer} onClick={handleNavClick}>
                  {language === 'ar' ? 'إعدادات الباركود' : 'Barcode Settings'}
                </NavItem>
              )}
            </>
          )}
        </nav>
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <UserCog className="w-5 h-5 text-gray-500" />
            <span className="mr-2 text-sm font-medium text-gray-700">
              {user?.role && (
                language === 'ar' 
                  ? user.role === 'admin' 
                    ? 'مدير النظام' 
                    : user.role === 'owner' 
                      ? 'مالك المتجر' 
                      : user.role === 'manager' 
                        ? 'مدير' 
                        : user.role === 'cashier' 
                          ? 'كاشير' 
                          : 'مورد'
                  : user.role.charAt(0).toUpperCase() + user.role.slice(1)
              )}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}