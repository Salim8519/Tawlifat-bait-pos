import React, { useState, useEffect } from 'react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getBusinessName } from '../../services/businessService';

interface VendorPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorName: string;
  vendorCode: string;
  branchName: string;
  ownerBusinessCode: string;
  ownerBusinessName: string;
}

type PaymentType = 'deposit' | 'withdrawal';

export function VendorPaymentModal({
  isOpen,
  onClose,
  vendorName,
  vendorCode,
  branchName,
  ownerBusinessCode,
  ownerBusinessName
}: VendorPaymentModalProps) {
  const { language } = useLanguageStore();
  const dir = language === 'ar' ? 'rtl' : 'ltr';
  
  const [amount, setAmount] = useState<string>('');
  const [paymentType, setPaymentType] = useState<PaymentType>('deposit');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>(ownerBusinessName);
  const [isLoadingBusinessName, setIsLoadingBusinessName] = useState(true);

  useEffect(() => {
    async function fetchBusinessName() {
      setIsLoadingBusinessName(true);
      try {
        const name = await getBusinessName(ownerBusinessCode);
        setBusinessName(name);
      } catch (err) {
        console.error('Error fetching business name:', err);
        setError(language === 'ar' 
          ? 'حدث خطأ أثناء جلب بيانات الشركة' 
          : 'Error fetching business details');
      } finally {
        setIsLoadingBusinessName(false);
      }
    }
    fetchBusinessName();
  }, [ownerBusinessCode, language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError(language === 'ar' ? 'يرجى إدخال مبلغ صحيح' : 'Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const numericAmount = Number(amount);

    try {
      const transactionId = `${ownerBusinessCode}-${new Date().getTime()}`;
      
      // Start a Supabase transaction
      const { data: vendorTransactionData, error: vendorError } = await supabase
        .from('vendor_transactions')
        .insert([
          {
            transaction_id: transactionId,
            business_code: ownerBusinessCode,
            business_name: businessName,
            vendor_code: vendorCode,
            vendor_name: vendorName,
            branch_name: branchName,
            transaction_type: 'expense',  // Both deposit and withdrawal are expenses for tracking
            amount: paymentType === 'deposit' ? numericAmount : -numericAmount,
            profit: paymentType === 'deposit' ? numericAmount : -numericAmount,
            transaction_date: new Date().toISOString(),
            status: 'completed',
            notes: paymentType === 'deposit' 
              ? language === 'ar' 
                ? `إيداع من ${businessName}`
                : `Deposit from ${businessName}`
              : language === 'ar'
                ? `سحب إلى ${businessName}`
                : `Withdrawal to ${businessName}`
          }
        ]);

      if (vendorError) throw vendorError;

      // Record in transactions_overall
      const { error: overallError } = await supabase
        .from('transactions_overall')
        .insert([
          {
            business_code: ownerBusinessCode,
            business_name: businessName,
            branch_name: branchName,
            transaction_type: paymentType === 'deposit' ? 'vendor_deposit' : 'vendor_withdrawal',
            amount: paymentType === 'deposit' ? -numericAmount : numericAmount,
            owner_profit_from_this_transcation: paymentType === 'deposit' ? -numericAmount : numericAmount,
            vendor_code: vendorCode,
            vendor_name: vendorName,
            transaction_date: new Date().toISOString(),
            payment_method: 'cash',
            currency: 'OMR',
            transaction_reason: paymentType === 'deposit'
              ? language === 'ar'
                ? `إيداع للمورد ${vendorName}`
                : `Deposit to vendor ${vendorName}`
              : language === 'ar'
                ? `سحب من المورد ${vendorName}`
                : `Withdrawal from vendor ${vendorName}`
          }
        ]);

      if (overallError) throw overallError;

      // Close modal and reset form
      onClose();
      setAmount('');
      setPaymentType('deposit');
    } catch (err) {
      console.error('Error processing payment:', err);
      setError(language === 'ar' 
        ? 'حدث خطأ أثناء معالجة الدفع' 
        : 'Error processing payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
        dir={dir}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">
            {language === 'ar' 
              ? `إدارة الدفعات - ${vendorName}`
              : `Payment Management - ${vendorName}`}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6 text-sm text-gray-600">
          <div className="flex justify-between py-1 border-b">
            <span>{language === 'ar' ? 'اسم المورد:' : 'Vendor Name:'}</span>
            <span className="font-medium">{vendorName}</span>
          </div>
          <div className="flex justify-between py-1 border-b">
            <span>{language === 'ar' ? 'الفرع:' : 'Branch:'}</span>
            <span className="font-medium">{branchName}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'ar' ? 'نوع العملية' : 'Operation Type'}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="deposit"
                  checked={paymentType === 'deposit'}
                  onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                  className="mr-2"
                />
                {language === 'ar' ? 'إيداع' : 'Deposit'}
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="withdrawal"
                  checked={paymentType === 'withdrawal'}
                  onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                  className="mr-2"
                />
                {language === 'ar' ? 'سحب' : 'Withdrawal'}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'ar' ? 'المبلغ' : 'Amount'}
            </label>
            <div className="flex items-center gap-2">
              <div className="text-gray-500 text-sm font-medium">OMR</div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="block w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.000"
                min="0"
                step="0.001"
                dir="ltr"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoadingBusinessName}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting 
                ? (language === 'ar' ? 'جارٍ المعالجة...' : 'Processing...')
                : isLoadingBusinessName
                ? (language === 'ar' ? 'جارٍ التحميل...' : 'Loading...')
                : (language === 'ar' ? 'تأكيد' : 'Confirm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
