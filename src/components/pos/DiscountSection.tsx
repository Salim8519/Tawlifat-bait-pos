import React, { useState } from 'react';
import { Tag, Ticket } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { posTranslations } from '../../translations/pos';
import type { Discount, DiscountType } from '../../types/pos';

interface DiscountSectionProps {
  onApplyDiscount: (discount: Discount) => void;
  onApplyCoupon: (code: string) => void;
}

export function DiscountSection({ onApplyDiscount, onApplyCoupon }: DiscountSectionProps) {
  const { language } = useLanguageStore();
  const t = posTranslations[language];
  const [discountType, setDiscountType] = useState<DiscountType>('fixed');
  const [discountValue, setDiscountValue] = useState('');
  const [couponCode, setCouponCode] = useState('');

  const handleApplyDiscount = () => {
    if (discountValue) {
      onApplyDiscount({
        type: discountType,
        value: parseFloat(discountValue)
      });
    }
  };

  return (
    <div className="border-t p-4 space-y-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="space-y-2">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Tag className="w-5 h-5 text-gray-500" />
          <span className="font-medium">{t.discount}</span>
        </div>
        <div className="flex space-x-2 space-x-reverse">
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as DiscountType)}
            className="w-1/3 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="fixed">{t.fixed}</option>
            <option value="percentage">{t.percentage}</option>
          </select>
          <input
            type="number"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            placeholder={t.value}
            className="flex-1 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            onClick={handleApplyDiscount}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {t.apply}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2 space-x-reverse">
          <Ticket className="w-5 h-5 text-gray-500" />
          <span className="font-medium">{t.coupon}</span>
        </div>
        <div className="flex space-x-2 space-x-reverse">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder={t.enterCoupon}
            className="flex-1 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            onClick={() => onApplyCoupon(couponCode)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {t.apply}
          </button>
        </div>
      </div>
    </div>
  );
}