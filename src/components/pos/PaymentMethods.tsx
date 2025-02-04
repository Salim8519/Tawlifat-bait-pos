import React from 'react';
import { CreditCard, Banknote, Globe } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { posTranslations } from '../../translations/pos';

export type PaymentMethod = 'cash' | 'card' | 'online';

interface Props {
  selectedMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
}

export function PaymentMethods({ selectedMethod, onMethodChange }: Props) {
  const { language } = useLanguageStore();
  const t = posTranslations[language];

  const methods: Array<{
    id: PaymentMethod;
    icon: typeof CreditCard;
    label: string;
  }> = [
    { id: 'cash', icon: Banknote, label: t.cashPayment },
    { id: 'card', icon: CreditCard, label: t.creditPayment },
    { id: 'online', icon: Globe, label: t.onlinePayment }
  ];

  return (
    <div className="border-t p-2">
      <h3 className="font-medium mb-2 text-sm">{t.paymentMethod}</h3>
      <div className="grid grid-cols-3 gap-2">
        {methods.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onMethodChange(id)}
            className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-colors ${
              selectedMethod === id
                ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                : 'border-gray-200 hover:border-indigo-200'
            }`}
          >
            <Icon className="w-5 h-5 mb-1" />
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}