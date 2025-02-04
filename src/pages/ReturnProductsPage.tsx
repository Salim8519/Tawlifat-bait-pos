import React, { useState, useEffect, useMemo } from 'react';
import { Search, ArrowLeftRight, AlertCircle } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { useUserStore } from '../store/useUserStore';
import { useAuthStore } from '../store/useAuthStore';
import { useBusinessStore } from '../store/useBusinessStore';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { BranchSelector } from '../components/products/BranchSelector';
import { getBranchesByBusinessCode } from '../services/businessService';
import { updateCashForReturn } from '../services/cashTrackingService';
import type { Branch } from '../types/branch';
import { returnProductsTranslations } from '../translations/returnProducts';

interface SoldProduct {
  sold_product_id: string;
  product_name: string;
  unit_price_original: number;
  unit_price_by_bussniess?: number;
  quantity: number;
  receipt_id: string;
  business_code: string;
  business_bracnh_name: string;
  vendor_code_if_by_vendor?: string;
  total_price: number;
  comission_for_bussnies_from_vendor?: number;
  created_at: string;
  returned_quantity?: number;
  available_quantity?: number;
}

interface Receipt {
  receipt_id: string;
  total_amount: number;
  branch_name: string;
  business_code: string;
  created_at: string;
  transaction_id: string;
  payment_method: string;
  cashier_name: string;
  receipt_date: string;
  is_return?: boolean;
}

export function ReturnProductsPage() {
  const { language } = useLanguageStore();
  const { userProfile, fetchUserProfile } = useUserStore();
  const { user } = useAuthStore();
  const { branches, setBranches } = useBusinessStore();
  const [receiptNumber, setReceiptNumber] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [soldProducts, setSoldProducts] = useState<SoldProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [returnReason, setReturnReason] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = useMemo(() => {
    return Object.entries(returnProductsTranslations).reduce((acc, [key, value]) => {
      acc[key] = value[language];
      return acc;
    }, {} as Record<keyof typeof returnProductsTranslations, string>);
  }, [language]);

  useEffect(() => {
    if (user?.businessCode) {
      getBranchesByBusinessCode(user.businessCode).then(branchesData => {
        setBranches(branchesData);
      }).catch(error => {
        console.error('Error fetching branches:', error);
        toast.error(t.errorFetchingBranches);
      });
    }
  }, [user?.businessCode]);

  useEffect(() => {
    if (receipt) {
      setCustomerName(receipt.customer_name || '');
      setCustomerPhone(receipt.customer_phone || '');
      setPaymentMethod(receipt.payment_method || 'cash');
    }
  }, [receipt]);

  useEffect(() => {
    if (user?.id && !userProfile) {
      fetchUserProfile();
    }
  }, [user?.id, userProfile, fetchUserProfile]);

  const paymentMethods = [
    { value: 'cash', label: t.cash },
    { value: 'card', label: t.card },
    { value: 'online', label: t.online },
    { value: 'bank_transfer', label: t.bankTransfer }
  ];

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!receiptNumber.trim()) {
        toast.error(t.enterReceiptNumber);
        return;
      }

      if (!selectedBranch) {
        toast.error(t.selectBranchFirst);
        return;
      }

      if (!user?.businessCode) {
        toast.error(t.userInfoError);
        return;
      }

      // First fetch the receipt
      const { data: receiptData, error: receiptError } = await supabase
        .from('receipts')
        .select('*')
        .eq('receipt_id', receiptNumber)
        .eq('business_code', user.businessCode)
        .eq('branch_name', selectedBranch)
        .single();

      if (receiptError || !receiptData) {
        console.error('Receipt error:', receiptError);
        throw new Error(t.receiptNotFound);
      }

      setReceipt(receiptData);

      // Then fetch the sold products for this receipt
      const { data: productsData, error: productsError } = await supabase
        .from('sold_products')
        .select('*')
        .eq('receipt_id', receiptNumber)
        .eq('business_code', user.businessCode)
        .eq('business_bracnh_name', selectedBranch);

      if (productsError) {
        console.error('Products error:', productsError);
        throw new Error(t.errorFetchingProducts);
      }

      // Check for existing returns for these products
      const { data: returnsData, error: returnsError } = await supabase
        .from('returned_products')
        .select('sold_product_id, quantity')
        .eq('original_receipt_id', receiptNumber);

      if (returnsError) {
        console.error('Error fetching returns:', returnsError);
      }

      // Create a map of returned quantities
      const returnedQuantities = (returnsData || []).reduce((acc, ret) => {
        acc[ret.sold_product_id] = (acc[ret.sold_product_id] || 0) + ret.quantity;
        return acc;
      }, {} as Record<string, number>);

      // Combine product data with return information
      const productsWithReturns = productsData.map(product => ({
        ...product,
        returned_quantity: returnedQuantities[product.sold_product_id] || 0,
        available_quantity: product.quantity - (returnedQuantities[product.sold_product_id] || 0)
      }));

      setSoldProducts(productsWithReturns);
      setSelectedProducts([]);
      setReturnReason('');
    } catch (err: any) {
      console.error('Error searching:', err);
      toast.error(err.message || t.errorFetchingProducts);
      setReceipt(null);
      setSoldProducts([]);
      setSelectedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!receipt || selectedProducts.length === 0 || !returnReason || !paymentMethod) return;

    try {
      setLoading(true);
      setError(null);

      // Calculate total return amount
      const totalReturnAmount = selectedProducts.reduce((total, productId) => {
        const product = soldProducts.find(p => p.sold_product_id === productId);
        if (!product) return total;
        return total + (product.quantity * product.unit_price_original);
      }, 0);

      const now = new Date().toISOString();
      
      // Create a detailed receipt note
      const receiptNote = [
        `Return for receipt: ${receipt.receipt_id}`,
        `Original transaction date: ${new Date(receipt.receipt_date).toLocaleDateString()}`,
        `Original cashier: ${receipt.cashier_name}`,
        `Return processed by: ${userProfile?.full_name || 'Unknown'}`,
        `Return reason: ${returnReason}`
      ].join('\n');

      // Create return receipt
      const { data: returnReceipt, error: returnError } = await supabase
        .from('receipts')
        .insert([
          {
            receipt_id: `RET-${receipt.receipt_id}`,
            transaction_id: `TR-${Date.now()}`,
            business_code: receipt.business_code,
            branch_name: receipt.branch_name,
            cashier_name: userProfile?.full_name || 'Unknown',
            customer_name: customerName || receipt.customer_name,
            customer_phone: customerPhone || receipt.customer_phone,
            total_amount: -totalReturnAmount, // Negative amount for returns
            payment_method: paymentMethod,
            is_return: true,
            return_reason: returnReason,
            receipt_note: receiptNote,
            receipt_date: now,
            created_at: now,
            // Copy relevant fields from original receipt
            vendor_commission_enabled: receipt.vendor_commission_enabled,
            tax_amount: 0,
            discount: 0,
            commission_amount_from_vendors: 0,
            long_text_receipt: `Return Receipt\n\nOriginal Receipt: ${receipt.receipt_id}\nReturn Date: ${new Date().toLocaleDateString()}\nProcessed By: ${userProfile?.full_name || 'Unknown'}\nReason: ${returnReason}\n\nReturned Items:\n${selectedProducts.map(productId => {
              const product = soldProducts.find(p => p.sold_product_id === productId);
              return `- ${product?.product_name}: ${product?.unit_price_original} x ${product?.quantity}`;
            }).join('\n')}`
          }
        ])
        .select()
        .single();

      if (returnError) throw returnError;

      // Create return product entries
      const { error: productsError } = await supabase
        .from('sold_products')
        .insert(
          selectedProducts.map(productId => {
            const product = soldProducts.find(p => p.sold_product_id === productId);
            if (!product) throw new Error('Product not found');
            
            return {
              sold_product_id: `RET-${productId}-${Date.now()}`,
              receipt_id: returnReceipt.receipt_id,
              product_name: product.product_name,
              unit_price_original: product.unit_price_original,
              unit_price_by_bussniess: product.unit_price_by_bussniess,
              quantity: -product.quantity, // Negative quantity for returns
              business_code: receipt.business_code,
              business_bracnh_name: receipt.branch_name,
              total_price: -(product.quantity * product.unit_price_original),
              vendor_code_if_by_vendor: product.vendor_code_if_by_vendor,
              comission_for_bussnies_from_vendor: product.comission_for_bussnies_from_vendor,
              created_at: now
            };
          })
        );

      if (productsError) throw productsError;

      // If payment method is cash, update cash tracking
      if (paymentMethod === 'cash' && user?.businessCode) {
        try {
          await updateCashForReturn(
            user.businessCode,
            receipt.branch_name,
            userProfile?.full_name || 'Unknown',
            totalReturnAmount
          );
        } catch (cashError) {
          console.error('Error updating cash tracking:', cashError);
          // Don't throw here, as the return was successful
          toast.error(t.errorUpdatingCash);
        }
      }

      toast.success(t.returnProcessedSuccessfully);
      // Reset form
      setReceipt(null);
      setReceiptNumber('');
      setSoldProducts([]);
      setSelectedProducts([]);
      setReturnReason('');
      setCustomerName('');
      setCustomerPhone('');
      setPaymentMethod('');
      
    } catch (error) {
      console.error('Error processing return:', error);
      setError(t.errorProcessingReturn);
    } finally {
      setLoading(false);
    }
  };

  const handleBranchChange = (branch: string) => {
    setSelectedBranch(branch);
    // Reset form when branch changes
    setReceipt(null);
    setSoldProducts([]);
    setSelectedProducts([]);
    setReturnReason('');
    setReceiptNumber('');
  };

  const handleProductSelect = (product: SoldProduct) => {
    const isSelected = selectedProducts.some(id => id === product.sold_product_id);
    if (isSelected) {
      setSelectedProducts(selectedProducts.filter(id => id !== product.sold_product_id));
    } else {
      setSelectedProducts([...selectedProducts, product.sold_product_id]);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">{t.returnProducts}</h1>
      
      {/* Branch Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.selectBranch}
        </label>
        <BranchSelector
          branches={branches}
          selectedBranch={selectedBranch}
          onBranchChange={handleBranchChange}
          className="w-full"
        />
      </div>

      {/* Receipt Search */}
      <div className="mb-6">
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={receiptNumber}
            onChange={(e) => setReceiptNumber(e.target.value)}
            placeholder={t.enterReceiptNumber}
            className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500"
            disabled={!selectedBranch}
          />
          <button
            onClick={handleSearch}
            disabled={loading || !receiptNumber || !selectedBranch}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            {loading ? t.searching : t.search}
          </button>
        </div>
        {!selectedBranch && (
          <p className="text-sm text-amber-600">
            {t.selectBranchFirst}
          </p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {receipt && (
        <div className="mb-6 p-4 border rounded bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">{t.returnDetails}</h2>
          
          {/* Original Receipt Info */}
          <div className="bg-white p-4 rounded border mb-4">
            <h3 className="text-lg font-medium mb-2">{t.originalReceipt}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">{t.receiptId}: </span>
                <span>{receipt.receipt_id}</span>
              </div>
              <div>
                <span className="font-medium">{t.date}: </span>
                <span>{new Date(receipt.receipt_date).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="font-medium">{t.totalAmount}: </span>
                <span>{receipt.total_amount}</span>
              </div>
              <div>
                <span className="font-medium">{t.originalCashier}: </span>
                <span>{receipt.cashier_name}</span>
              </div>
              <div>
                <span className="font-medium">{t.branch}: </span>
                <span>{receipt.branch_name}</span>
              </div>
            </div>
          </div>

          {/* Products List */}
          {soldProducts.length > 0 && (
            <div className="space-y-4 mb-6">
              <div className="bg-white p-4 rounded border">
                <h3 className="text-lg font-medium mb-3">{t.products}</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t.productName}
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t.quantity}
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t.price}
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t.total}
                        </th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t.status}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {soldProducts.map((product) => {
                        const isSelected = selectedProducts.includes(product.sold_product_id);
                        const isReturned = product.returned_quantity > 0;
                        
                        return (
                          <tr 
                            key={product.sold_product_id}
                            onClick={() => !isReturned && handleProductSelect(product)}
                            className={`${
                              isReturned ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'
                            } ${
                              isSelected ? 'bg-blue-50' : ''
                            }`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {product.product_name}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                              {product.quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                              {product.unit_price_original}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-medium">
                              {(product.quantity * product.unit_price_original).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              {isReturned ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                  {t.alreadyReturned}
                                </span>
                              ) : isSelected ? (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  {t.selected}
                                </span>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedProducts.length > 0 && (
                <div className="bg-white p-4 rounded border">
                  <h3 className="text-lg font-medium mb-3">{t.selectedProducts}</h3>
                  <div className="space-y-2">
                    {selectedProducts.map(productId => {
                      const product = soldProducts.find(p => p.sold_product_id === productId);
                      if (!product) return null;
                      
                      return (
                        <div key={productId} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                          <div>
                            <div className="font-medium">{product.product_name}</div>
                            <div className="text-sm text-gray-500">
                              {t.quantity}: {product.quantity} × {product.unit_price_original}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">
                              {t.total}: {(product.quantity * product.unit_price_original).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Return Information */}
          <div className="space-y-4">
            {/* Customer Information */}
            <div className="bg-white p-4 rounded border">
              <h3 className="text-lg font-medium mb-3">{t.customerInformation}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.customerName}
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder={t.enterCustomerName}
                    className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.customerPhone}
                  </label>
                  <input
                    type="text"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder={t.enterCustomerPhone}
                    className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Return Details */}
            <div className="bg-white p-4 rounded border">
              <h3 className="text-lg font-medium mb-3">{t.returnInformation}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.returnReason} *
                  </label>
                  <textarea
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder={t.enterReturnReason}
                    className="p-2 border rounded w-full h-24 focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.paymentMethod} *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="p-2 border rounded w-full focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">{t.selectPaymentMethod}</option>
                    {paymentMethods.map(method => (
                      <option key={method.value} value={method.value}>
                        {t[method.value as keyof typeof t]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Return Button */}
          <div className="mt-6">
            <button
              onClick={handleReturn}
              disabled={loading || selectedProducts.length === 0 || !returnReason || !paymentMethod}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? t.processing : t.processReturn}
            </button>
            {error && (
              <p className="mt-2 text-red-500 text-sm">{error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
