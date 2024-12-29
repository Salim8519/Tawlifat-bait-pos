import React, { useState } from 'react';
import { Trash2, MessageSquare } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { posTranslations } from '../../translations/pos';
import type { CartItem as CartItemType } from '../../types/pos';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onRemove: (id: string) => void;
}

export function CartItem({ item, onUpdateQuantity, onUpdateNotes, onRemove }: CartItemProps) {
  const { language } = useLanguageStore();
  const t = posTranslations[language];
  const [showNotes, setShowNotes] = useState(Boolean(item.notes));

  return (
    <div className="border-b last:border-b-0 py-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between">
        <div className="flex-1">
          <h3 className="font-medium">{item.nameAr}</h3>
          <p className="text-sm text-gray-500">{item.price.toFixed(2)} {t.currency}</p>
          {item.notes && !showNotes && (
            <div className="mt-1 text-xs text-gray-500 bg-gray-50 p-2 rounded-md">
              <p className="line-clamp-2">{item.notes}</p>
            </div>
          )}
        </div>
        <div className="flex items-start space-x-2 space-x-reverse mr-4">
          <div className="flex items-center space-x-1 space-x-reverse">
            <button
              onClick={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
              className="w-6 h-6 flex items-center justify-center border rounded hover:bg-gray-100"
            >
              -
            </button>
            <span className="w-8 text-center">{item.quantity}</span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              className="w-6 h-6 flex items-center justify-center border rounded hover:bg-gray-100"
            >
              +
            </button>
          </div>
          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`text-gray-500 hover:text-gray-700 ${
              showNotes || item.notes ? 'bg-gray-100 rounded-full p-1' : ''
            } ${item.notes ? 'text-indigo-600' : ''}`}
            title={item.notes ? t.editNotes : t.addNotes}
          >
            <MessageSquare className="w-5 h-5" />
          </button>
          <button
            onClick={() => onRemove(item.id)}
            className="text-red-500 hover:text-red-700"
            title={t.removeFromCart}
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {showNotes && (
        <div className="mt-2">
          <textarea
            value={item.notes ?? ''}
            onChange={(e) => onUpdateNotes(item.id, e.target.value)}
            placeholder={t.addNotes}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm resize-none"
            rows={2}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          />
        </div>
      )}
    </div>
  );
}