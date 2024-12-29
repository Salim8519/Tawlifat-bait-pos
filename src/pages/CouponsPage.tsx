import React, { useState } from 'react';
import { Plus, Search, Ticket, RefreshCw } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { couponTranslations } from '../translations/coupons';
import type { Discount, DiscountType } from '../types/pos';

interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: DiscountType;
  value: number;
  startDate: string;
  expiryDate: string;
  minimumPurchase?: number;
  maxUsage?: number;
  usageCount: number;
  isActive: boolean;
}

// Mock data - replace with API calls
const mockCoupons: Coupon[] = [
  {
    id: '1',
    code: 'SUMMER2024',
    name: 'خصم الصيف',
    description: 'خصم خاص لموسم الصيف',
    type: 'percentage',
    value: 15,
    startDate: '2024-06-01',
    expiryDate: '2024-08-31',
    minimumPurchase: 50,
    maxUsage: 100,
    usageCount: 45,
    isActive: true
  },
  {
    id: '2',
    code: 'WELCOME10',
    name: 'خصم الترحيب',
    type: 'fixed',
    value: 10,
    startDate: '2024-01-01',
    expiryDate: '2024-12-31',
    usageCount: 230,
    isActive: true
  },
  {
    id: '3',
    code: 'FLASH25',
    name: 'تخفيضات فلاش',
    type: 'percentage',
    value: 25,
    startDate: '2024-03-01',
    expiryDate: '2024-03-02',
    maxUsage: 50,
    usageCount: 50,
    isActive: false
  }
];

export function CouponsPage() {
  const { language } = useLanguageStore();
  const t = couponTranslations[language];

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired'>('all');

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const filteredCoupons = mockCoupons.filter(coupon => {
    const matchesSearch = 
      coupon.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coupon.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const isExpired = new Date(coupon.expiryDate) < new Date();
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && coupon.isActive && !isExpired) ||
      (filterStatus === 'expired' && (isExpired || !coupon.isActive));

    return matchesSearch && matchesStatus;
  });

  const handleSave = (formData: FormData) => {
    // Here you would typically make an API call to save the coupon
    console.log('Saving coupon:', Object.fromEntries(formData));
    setShowAddModal(false);
    setEditingCoupon(null);
  };

  const getCouponStatus = (coupon: Coupon) => {
    const isExpired = new Date(coupon.expiryDate) < new Date();
    if (!coupon.isActive) {
      return {
        text: t.inactive,
        className: 'bg-gray-100 text-gray-800'
      };
    }
    if (isExpired) {
      return {
        text: t.expired,
        className: 'bg-red-100 text-red-800'
      };
    }
    if (coupon.maxUsage && coupon.usageCount >= coupon.maxUsage) {
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
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.couponCode}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.discountType}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.expiryDate}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.usageCount}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.status}
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">{t.actions}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCoupons.map((coupon) => {
                const status = getCouponStatus(coupon);
                return (
                  <tr key={coupon.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{coupon.code}</div>
                      <div className="text-sm text-gray-500">{coupon.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {coupon.type === 'fixed' ? (
                        <span>{coupon.value} {t.currency}</span>
                      ) : (
                        <span>{coupon.value}%</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(coupon.expiryDate).toLocaleDateString(
                        language === 'ar' ? 'ar-SA' : 'en-US'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {coupon.usageCount} / {coupon.maxUsage || t.unlimited}
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
                        onClick={() => {
                          if (confirm(t.confirmDelete)) {
                            // Handle delete
                            console.log('Deleting coupon:', coupon.id);
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
                    {t.couponName} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingCoupon?.name}
                    required
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.couponCode} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex space-x-2 space-x-reverse">
                    <input
                      type="text"
                      name="code"
                      defaultValue={editingCoupon?.code}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.description}
                    <span className="text-gray-500 text-xs mr-1">({t.optional})</span>
                  </label>
                  <textarea
                    name="description"
                    defaultValue={editingCoupon?.description}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.discountType} <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="type"
                      defaultValue={editingCoupon?.type || 'fixed'}
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
                      defaultValue={editingCoupon?.value}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.startDate} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      defaultValue={editingCoupon?.startDate}
                      required
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.expiryDate} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="expiryDate"
                      defaultValue={editingCoupon?.expiryDate}
                      required
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.minimumPurchase}
                      <span className="text-gray-500 text-xs mr-1">({t.optional})</span>
                    </label>
                    <input
                      type="number"
                      name="minimumPurchase"
                      defaultValue={editingCoupon?.minimumPurchase}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.maxUsage}
                      <span className="text-gray-500 text-xs mr-1">({t.optional})</span>
                    </label>
                    <input
                      type="number"
                      name="maxUsage"
                      defaultValue={editingCoupon?.maxUsage}
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
    </div>
  );
}