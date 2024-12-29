import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { productTranslations } from '../../translations/products';
import type { Product } from '../../types/pos';

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
}

export function ProductCard({ product, onEdit }: ProductCardProps) {
  const { language } = useLanguageStore();
  const t = productTranslations[language];

  const isExpired = React.useMemo(() => {
    if (product.type === 'food' && product.expiryDate) {
      return new Date(product.expiryDate) < new Date();
    }
    return false;
  }, [product]);

  const daysUntilExpiry = React.useMemo(() => {
    if (product.type === 'food' && product.expiryDate) {
      const today = new Date();
      const expiry = new Date(product.expiryDate);
      const diffTime = expiry.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return null;
  }, [product]);

  return (
    <div 
      className={`bg-white rounded-lg shadow p-4 ${isExpired ? 'border-2 border-red-500' : ''}`}
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="aspect-square bg-gray-100 rounded-md mb-3"></div>
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <h3 className="font-medium">{product.nameAr}</h3>
          <span className="text-sm text-gray-500">{product.vendorName}</span>
          <span className={`px-2 py-1 text-xs rounded-full ${
            product.type === 'food' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {product.type === 'food' ? t.food : t.nonFood}
          </span>
        </div>
        
        <p className="text-sm text-gray-500">{product.category}</p>
        <p className="text-indigo-600 font-bold">{product.price.toFixed(2)} {t.currency}</p>
        
        {product.type === 'food' && (
          <div className="pt-2 border-t">
            {isExpired ? (
              <div className="flex items-center text-red-600 text-sm">
                <AlertTriangle className="w-4 h-4 ml-1" />
                {t.expired}
              </div>
            ) : daysUntilExpiry && daysUntilExpiry <= 7 ? (
              <div className="flex items-center text-yellow-600 text-sm">
                <Clock className="w-4 h-4 ml-1" />
                {daysUntilExpiry === 0 
                  ? t.expiresInToday 
                  : t.expiresIn.replace('{days}', daysUntilExpiry.toString())
                }
              </div>
            ) : null}
          </div>
        )}

        <button
          onClick={() => onEdit(product)}
          className="mt-2 w-full px-4 py-2 text-sm text-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {t.edit}
        </button>
      </div>
    </div>
  );
}