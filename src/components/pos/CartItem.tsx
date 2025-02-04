import React, { useState } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { posTranslations } from '../../translations/pos';
import type { CartItem as CartItemType } from '../../types/pos';

interface CartItemProps {
  item: CartItemType;
  availableQuantity: number;
  isTrackable: boolean;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export function CartItem({ 
  item, 
  availableQuantity, 
  isTrackable, 
  onUpdateQuantity, 
  onRemove 
}: CartItemProps) {
  const { language } = useLanguageStore();
  const t = posTranslations[language];
  const [showError, setShowError] = useState(false);

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0) {
      if (!isTrackable && value > availableQuantity) {
        setShowError(true);
        setTimeout(() => setShowError(false), 3000);
        return;
      }
      onUpdateQuantity(item.id, value);
    }
  };

  const handleIncrement = () => {
    if (!isTrackable && item.quantity >= availableQuantity) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
      return;
    }
    onUpdateQuantity(item.id, item.quantity + 1);
  };

  return (
    <div className="border-b last:border-b-0 py-2" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between">
        <div className="flex-1">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">{item.nameAr}</span>
            <span className="text-sm text-gray-500">
              {item.price.toFixed(3)} {t.currency}
            </span>
          </div>
          {!isTrackable && (
            <p className="text-xs text-gray-500 mt-1">
              {t.available}: {availableQuantity}
            </p>
          )}
          {showError && !isTrackable && (
            <div className="flex items-center text-xs text-red-600 mt-1">
              <AlertCircle className="w-3 h-3 mr-1" />
              {t.insufficientQuantity}
            </div>
          )}
        </div>
        <div className="flex items-start space-x-2 space-x-reverse mr-2">
          <div className="flex items-center space-x-1 space-x-reverse">
            <button
              onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
              className="w-7 h-7 flex items-center justify-center border rounded hover:bg-gray-100 text-lg font-medium"
            >
              -
            </button>
            <input
              type="number"
              min="0"
              max={!isTrackable ? availableQuantity : undefined}
              value={item.quantity}
              onChange={handleQuantityChange}
              className={`w-12 text-center text-lg font-medium border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                !isTrackable && item.quantity > availableQuantity ? 'border-red-500' : ''
              }`}
              dir="ltr"
            />
            <button
              onClick={handleIncrement}
              className={`w-7 h-7 flex items-center justify-center border rounded hover:bg-gray-100 text-lg font-medium ${
                !isTrackable && item.quantity >= availableQuantity ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={!isTrackable && item.quantity >= availableQuantity}
            >
              +
            </button>
          </div>
          <button
            onClick={() => onRemove(item.id)}
            className="text-red-500 hover:text-red-700"
            title={t.removeFromCart}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}