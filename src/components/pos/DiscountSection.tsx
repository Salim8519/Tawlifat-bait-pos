import React, { useState } from 'react';
import { Tag, Ticket } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { posTranslations } from '../../translations/pos';
import type { Discount, DiscountType } from '../../types/pos';

interface DiscountSectionProps {
  subtotal: number;
  onApplyDiscount: (discount: Discount) => void;
  onApplyCoupon: (code: string) => void;
  appliedDiscount?: Discount;
  appliedCoupon?: string;
  error?: string;
}

export function DiscountSection({ 
  subtotal,
  onApplyDiscount, 
  onApplyCoupon,
  appliedDiscount,
  appliedCoupon,
  error
}: DiscountSectionProps) {
  const { language } = useLanguageStore();
  const { settings } = useSettingsStore();
  const t = posTranslations[language];
  const [discountType, setDiscountType] = useState<DiscountType>(appliedDiscount?.type || 'fixed');
  const [discountValue, setDiscountValue] = useState(appliedDiscount?.value.toString() || '');
  const [couponCode, setCouponCode] = useState('');

  const handleApplyDiscount = () => {
    if (discountValue) {
      const value = parseFloat(discountValue);
      if (discountType === 'percentage' && value > 100) {
        return; // Don't allow percentage over 100%
      }
      if (discountType === 'fixed' && value > subtotal) {
        return; // Don't allow discount greater than subtotal
      }
      onApplyDiscount({
        type: discountType,
        value
      });
    }
  };

  const getDiscountDisplay = () => {
    if (!appliedDiscount) return null;
    const value = appliedDiscount.value;
    return appliedDiscount.type === 'fixed' 
      ? `${value.toFixed(3)} ${t.currency}`
      : `${value}%`;
  };
  return (
    <div className="border-t p-2 space-y-2" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="space-y-2">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Tag className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-sm">{t.discount}</span>
          {appliedDiscount && (
            <span className="text-sm text-green-600">
              {getDiscountDisplay()}
            </span>
          )}
        </div>
        <div className="flex space-x-2 space-x-reverse">
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as DiscountType)}
            className="w-1/3 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm py-1"
          >
            <option value="fixed">{t.fixed}</option>
            <option value="percentage">{t.percentage}</option>
          </select>
          <input
            type="number"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            placeholder={t.value}
            min="0"
            max={discountType === 'percentage' ? "100" : undefined}
            step={discountType === 'percentage' ? "1" : "0.001"}
            className="flex-1 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm py-1"
          />
          <button
            onClick={handleApplyDiscount}
            className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm"
          >
            {t.apply}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Ticket className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-sm">{t.coupon}</span>
          {appliedCoupon && (
            <span className="text-sm text-green-600">
              {appliedCoupon}
            </span>
          )}
        </div>
        <div className="flex space-x-2 space-x-reverse">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder={t.enterCoupon}
            className="flex-1 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm py-1"
          />
          <button
            onClick={() => onApplyCoupon(couponCode)}
            className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 text-sm"
          >
            {t.apply}
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-600 mt-1">{error}</p>
        )}
      </div>
      
      {settings?.tax_enabled && (
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">{t.tax} ({settings.tax_rate}%)</span>
            <span>{((subtotal * settings.tax_rate) / 100).toFixed(3)} {t.currency}</span>
          </div>
        </div>
      )}
    </div>
  );
}