import React from 'react';
import { Printer } from 'lucide-react';
import { useBarcodeService } from '../../hooks/useBarcodeService';
import { useLanguageStore } from '../../store/useLanguageStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import type { Product } from '../../types';
import type { Profile } from '../../types/profile';

interface Props {
  product: Product;
  className?: string;
  userProfile: Profile | null;
}

export function BarcodeButton({ product, className = '', userProfile }: Props) {
  const { language } = useLanguageStore();
  const { printProductBarcode, isPrinting, error } = useBarcodeService();
  const { settings } = useSettingsStore();

  const calculatePriceWithCommission = (product: Product): number => {
    // Only apply commission to vendor products if enabled in settings
    if (!settings || !settings.vendor_commission_enabled || !product.business_code_if_vendor) {
      return product.price;
    }

    // Check if the price meets minimum commission amount
    if (product.price < (settings.minimum_commission_amount || 0)) {
      return product.price;
    }

    // Calculate commission
    const commission = (product.price * settings.default_commission_rate) / 100;
    return product.price + commission;
  };

  const handlePrint = async () => {
    try {
      // Get the current user's business name from their profile
      const currentUserBusinessName = userProfile?.business_name;

      if (!currentUserBusinessName) {
        console.error('Current user business name not found');
        return;
      }

      // For vendor products, use business_name_of_product
      // For non-vendor products, only show the current user's business name
      const isVendorProduct = !!product.business_code_if_vendor;
      const vendorBusinessName = isVendorProduct ? product.business_name_of_product : undefined;

      // Calculate price with commission
      const finalPrice = calculatePriceWithCommission(product);

      const success = await printProductBarcode({
        productId: product.product_id.toString(),
        vendorId: product.business_code_if_vendor || product.business_code_of_owner,
        name: product.product_name,
        price: finalPrice,
        businessName: currentUserBusinessName,
        vendorName: vendorBusinessName,
        expiryDate: product.type === 'food' ? product.expiry_date : undefined,
        productionDate: product.type === 'food' ? product.production_date : undefined,
        existingBarcode: product.barcode
      });
      
      if (!success) {
        throw new Error('Print failed');
      }
    } catch (err) {
      console.error('Print failed:', err);
    }
  };

  return (
    <button
      onClick={handlePrint}
      disabled={isPrinting || !userProfile}
      className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={language === 'ar' ? 'طباعة الباركود' : 'Print Barcode'}
    >
      <Printer className="h-4 w-4 ml-2" />
      {language === 'ar' ? 'طباعة الباركود' : 'Print Barcode'}
    </button>
  );
}