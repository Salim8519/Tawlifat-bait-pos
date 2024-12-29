import React from 'react';
import { Printer } from 'lucide-react';
import { useBarcodeService } from '../../hooks/useBarcodeService';
import { useLanguageStore } from '../../store/useLanguageStore';
import type { Product } from '../../types';

interface Props {
  product: Product;
  className?: string;
}

export function BarcodeButton({ product, className = '' }: Props) {
  const { language } = useLanguageStore();
  const { printProductBarcode, isPrinting, error } = useBarcodeService();

  const handlePrint = async () => {
    try {
      const success = await printProductBarcode({
        productId: product.id,
        vendorId: product.vendorId,
        name: product.nameAr,
        price: product.price
      });
      
      if (!success) {
        throw new Error('Print failed');
      }
    } catch (err) {
      // Error is handled by the hook
      console.error('Print failed:', err);
    }
  };

  return (
    <button
      onClick={handlePrint}
      disabled={isPrinting}
      className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={language === 'ar' ? 'طباعة الباركود' : 'Print Barcode'}
    >
      <Printer className="h-4 w-4 ml-2" />
      {language === 'ar' ? 'طباعة الباركود' : 'Print Barcode'}
    </button>
  );
}