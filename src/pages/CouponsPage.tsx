import React, { useState, useEffect } from 'react';
import { Plus, Search, Ticket, RefreshCw } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { useAuthStore } from '../store/useAuthStore';
import { couponTranslations } from '../translations/coupons';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon, generateCouponCode, type Coupon } from '../services/couponService';
import { ArrowUpDown } from 'lucide-react';

type SortField = 'coupon_code' | 'discount_value' | 'number_of_uses' | 'expiry_date' | 'created_at';
type SortDirection = 'asc' | 'desc';

export function CouponsPage() {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const t = couponTranslations[language];

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired'>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showStatusModal, setShowStatusModal] = useState<Coupon | null>(null);

  useEffect(() => {
    if (user?.businessCode) {
      loadCoupons();
    }
  }, [user?.businessCode]);

  const loadCoupons = async () => {
    try {
      setIsLoading(true);
      const data = await getCoupons(user!.businessCode);
      setCoupons(data);
    } catch (err) {
      console.error('Error loading coupons:', err);
      setError(t.errorLoadingCoupons);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      scope="col"
      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
      onClick={() => handleSort(field)}
      title={sortField === field ? 
        (sortDirection === 'asc' ? t.sortDesc : t.sortAsc) :
        t.sortAsc
      }
    >
      <div className="flex items-center justify-end space-x-1 space-x-reverse">
        <span>{children}</span>
        <ArrowUpDown className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${
          sortField === field ? 'opacity-100 text-indigo-500' : 'text-gray-400'
        }`} />
      </div>
    </th>
  );

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = 
      coupon.coupon_code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const isExpired = coupon.expiry_date && new Date(coupon.expiry_date) < new Date();
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && !isExpired) ||
      (filterStatus === 'expired' && isExpired);

    return matchesSearch && matchesStatus;
  });

  const sortedCoupons = React.useMemo(() => {
    return [...filteredCoupons].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'coupon_code':
          comparison = a.coupon_code.localeCompare(b.coupon_code);
          break;
        case 'discount_value':
          comparison = a.discount_value - b.discount_value;
          break;
        case 'number_of_uses':
          comparison = a.number_of_uses - b.number_of_uses;
          break;
        case 'expiry_date':
          if (!a.expiry_date && !b.expiry_date) comparison = 0;
          else if (!a.expiry_date) comparison = 1;
          else if (!b.expiry_date) comparison = -1;
          else comparison = new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredCoupons, sortField, sortDirection]);

  const getCouponStatus = (coupon: Coupon) => {
    const isExpired = coupon.expiry_date && new Date(coupon.expiry_date) < new Date();
    if (!coupon.is_active) {
      return {
        text: t.inactive,
        className: 'bg-gray-100 text-gray-800'
      };
    } else if (isExpired) {
      return {
        text: t.expired,
        className: 'bg-red-100 text-red-800'
      };
    }
    if (coupon.max_uses && coupon.number_of_uses >= coupon.max_uses) {
      return {
        text: t.expired,
        className: 'bg-red-100 text-red-800'
      };
    }
    return {
      text: t.active,
      className: 'bg-green-100 text-green-800'
    };
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    try {
      await updateCoupon(coupon.coupon_id, {
        is_active: !coupon.is_active
      });
      await loadCoupons();
      setShowStatusModal(null);
    } catch (err) {
      console.error('Error toggling coupon status:', err);
      setError(t.errorUpdatingStatus);
    }
  };

  const handleSave = async (formData: FormData) => {
    try {
      const couponData = {
        business_code: user!.businessCode,
        coupon_code: formData.get('code') as string,
        discount_type: formData.get('type') as 'fixed' | 'percentage',
        discount_value: parseFloat(formData.get('value') as string),
        max_uses: formData.get('maxUsage') ? parseInt(formData.get('maxUsage') as string) : null,
        expiry_date: formData.get('expiryDate') as string || null,
        min_purchase_amount: formData.get('minimumPurchase') ? parseFloat(formData.get('minimumPurchase') as string) : 0,
        max_purchase_amount: formData.get('maximumPurchase') ? parseFloat(formData.get('maximumPurchase') as string) : 0,
        is_active: true
      };

      if (editingCoupon) {
        await updateCoupon(editingCoupon.coupon_id, couponData);
      } else {
        await createCoupon(couponData);
      }

      await loadCoupons();
      setShowAddModal(false);
      setEditingCoupon(null);
    } catch (err) {
      console.error('Error saving coupon:', err);
      setError(t.errorSavingCoupon);
    }
  };

  const handleDelete = async (couponId: string) => {
    try {
      await deleteCoupon(couponId);
      await loadCoupons();
    } catch (err) {
      console.error('Error deleting coupon:', err);
      setError(t.errorDeletingCoupon);
    }
  };

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.coupons}</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center"
        >
          <Plus className="w-5 h-5 ml-2" />
          {t.addCoupon}
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchCoupon}
                className="w-full pr-10 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              <option value="all">{t.allCoupons}</option>
              <option value="active">{t.activeCoupons}</option>
              <option value="expired">{t.expiredCoupons}</option>
            </select>
          </div>
        </div>

        {/* Coupons Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <SortableHeader field="coupon_code">
                  {t.couponCode}
                </SortableHeader>
                <SortableHeader field="discount_value">
                  {t.discountType}
                </SortableHeader>
                <SortableHeader field="expiry_date">
                  {t.expiryDate}
                </SortableHeader>
                <SortableHeader field="number_of_uses">
                  {t.usageCount}
                </SortableHeader>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.status}
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">{t.actions}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedCoupons.map((coupon) => {
                const status = getCouponStatus(coupon);
                return (
                  <tr key={coupon.coupon_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {coupon.coupon_code}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {coupon.discount_type === 'fixed' ? (
                        <span>{coupon.discount_value} {t.currency}</span>
                      ) : (
                        <span>{coupon.discount_value}%</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {coupon.expiry_date ? new Date(coupon.expiry_date).toLocaleDateString(
                        'en-US',
                        { year: 'numeric', month: '2-digit', day: '2-digit' }
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {coupon.number_of_uses} / {coupon.max_uses || t.unlimited}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.className}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setEditingCoupon(coupon)}
                        className="text-indigo-600 hover:text-indigo-900 ml-4"
                      >
                        {t.edit}
                      </button>
                      <button
                        onClick={() => setShowStatusModal(coupon)}
                        className={`text-${coupon.is_active ? 'red' : 'green'}-600 hover:text-${coupon.is_active ? 'red' : 'green'}-900 ml-4`}
                      >
                        {coupon.is_active ? t.deactivate : t.activate}
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(t.confirmDelete)) {
                            handleDelete(coupon.coupon_id);
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        {t.delete}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingCoupon) && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingCoupon ? t.editCoupon : t.addCoupon}
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSave(new FormData(e.currentTarget));
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.couponCode} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex space-x-2 space-x-reverse">
                    <input
                      type="text"
                      name="code"
                      defaultValue={editingCoupon?.coupon_code}
                      required
                      className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        input.value = generateCouponCode();
                      }}
                      className="px-3 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.discountType} <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="type"
                      defaultValue={editingCoupon?.discount_type || 'fixed'}
                      required
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                    >
                      <option value="fixed">{t.fixed}</option>
                      <option value="percentage">{t.percentage}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.discountValue} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="value"
                      defaultValue={editingCoupon?.discount_value}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.expiryDate}
                  </label>
                  <input
                    type="date"
                    name="expiryDate"
                    defaultValue={editingCoupon?.expiry_date ? new Date(editingCoupon.expiry_date).toISOString().split('T')[0] : ''}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.minimumPurchase}
                    </label>
                    <input
                      type="number"
                      name="minimumPurchase"
                      defaultValue={editingCoupon?.min_purchase_amount}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.maxUsage}
                    </label>
                    <input
                      type="number"
                      name="maxUsage"
                      defaultValue={editingCoupon?.max_uses}
                      min="0"
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 space-x-reverse">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingCoupon(null);
                    }}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    {t.save}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Toggle Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {showStatusModal.is_active ? t.deactivateCoupon : t.activateCoupon}
            </h2>
            <p className="text-gray-600 mb-6">
              {showStatusModal.is_active ? t.deactivateConfirmMessage : t.activateConfirmMessage}
            </p>
            
            <div className="flex justify-end space-x-2 space-x-reverse">
              <button
                onClick={() => setShowStatusModal(null)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => handleToggleStatus(showStatusModal)}
                className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  showStatusModal.is_active 
                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                    : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                }`}
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
}