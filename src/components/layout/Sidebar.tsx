import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  ShoppingCart, 
  ArrowLeftRight,
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
  ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useLanguageStore } from '../../store/useLanguageStore';

const NavItem = ({ to, icon: Icon, children }: { to: string; icon: any; children: React.ReactNode }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center space-x-2 space-x-reverse px-4 py-2 rounded-md transition-colors ${
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

export function Sidebar() {
  const { user } = useAuthStore();
  const { language } = useLanguageStore();

  return (
    <aside className="w-64 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-center p-4">
          <Store className="w-8 h-8 text-indigo-600" />
          <span className="mr-2 text-xl font-bold text-gray-900">
            {language === 'ar' ? 'متجري' : 'My Store'}
          </span>
        </div>
        
        <nav className="mt-8 space-y-2">
          {user?.role === 'super_admin' ? (
            <>
              <NavItem to="/dashboard" icon={ShieldCheck}>
                {language === 'ar' ? 'أصحاب المتاجر' : 'Store Owners'}
              </NavItem>
              <NavItem to="/cashiers" icon={Users}>
                {language === 'ar' ? 'الكاشير' : 'Cashiers'}
              </NavItem>
              <NavItem to="/vendors" icon={Store}>
                {language === 'ar' ? 'الموردين' : 'Vendors'}
              </NavItem>
            </>
          ) : user?.role === 'sub_vendor' ? (
            <>
              <NavItem to="/dashboard" icon={Home}>
                {language === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
              </NavItem>
              <NavItem to="/products" icon={Package}>
                {language === 'ar' ? 'منتجاتي' : 'My Products'}
              </NavItem>
            </>
          ) : (
            <>
              <NavItem to="/dashboard" icon={Home}>
                {language === 'ar' ? 'الرئيسية' : 'Dashboard'}
              </NavItem>
              <NavItem to="/pos" icon={ShoppingCart}>
                {language === 'ar' ? 'نقطة البيع' : 'POS'}
              </NavItem>
              <NavItem to="/products" icon={Package}>
                {language === 'ar' ? 'المنتجات' : 'Products'}
              </NavItem>
              <NavItem to="/upcoming-products" icon={Package}>
                {language === 'ar' ? 'المنتجات القادمة' : 'Upcoming Products'}
              </NavItem>
              <NavItem to="/customers" icon={Users}>
                {language === 'ar' ? 'العملاء' : 'Customers'}
              </NavItem>
              <NavItem to="/cash-drawer" icon={DollarSign}>
                {language === 'ar' ? 'درج النقود' : 'Cash Drawer'}
              </NavItem>
              <NavItem to="/returns" icon={ArrowLeftRight}>
                {language === 'ar' ? 'المرتجعات' : 'Returns'}
              </NavItem>
              <NavItem to="/receipts" icon={Receipt}>
                {language === 'ar' ? 'سجل الفواتير' : 'Receipts'}
              </NavItem>
              <NavItem to="/reports" icon={BarChart}>
                {language === 'ar' ? 'التقارير' : 'Reports'}
              </NavItem>
              
              {user?.role === 'owner' && (
                <>
                  <div className="pt-4 mb-2 border-t">
                    <p className="px-4 text-xs font-semibold text-gray-500 uppercase">
                      {language === 'ar' ? 'الإدارة' : 'Management'}
                    </p>
                  </div>
                  <NavItem to="/cashiers" icon={UserCog}>
                    {language === 'ar' ? 'الكاشير' : 'Cashiers'}
                  </NavItem>
                  <NavItem to="/sub-vendors" icon={Truck}>
                    {language === 'ar' ? 'الموردين' : 'Vendors'}
                  </NavItem>
                  <NavItem to="/branches" icon={Building2}>
                    {language === 'ar' ? 'الفروع' : 'Branches'}
                  </NavItem>
                  <NavItem to="/rentals" icon={Building2}>
                    {language === 'ar' ? 'الإيجارات' : 'Rentals'}
                  </NavItem>
                  <NavItem to="/coupons" icon={Ticket}>
                    {language === 'ar' ? 'الكوبونات' : 'Coupons'}
                  </NavItem>
                  <NavItem to="/settings" icon={Settings}>
                    {language === 'ar' ? 'الإعدادات' : 'Settings'}
                  </NavItem>
                  <NavItem to="/developer" icon={Code}>
                    {language === 'ar' ? 'المطور' : 'Developer'}
                  </NavItem>
                </>
              )}
            </>
          )}
        </nav>
      </div>
    </aside>
  );
}