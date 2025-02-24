import { useState } from 'react';
import { X } from 'lucide-react';
import type { VendorRental } from '../../services/vendorRentalsService';
import { createRentalHistory, checkExistingPayment, updatePaymentStatus } from '../../services/vendorRentalHistoryService';
import { recordVendorSpacePayment } from '../../services/vendorSpacePaymentService';
import { recordBusinessRentalIncome } from '../../services/businessTransactionService';
import { getBusinessName } from '../../services/businessService';
import { useLanguageStore } from '../../store/useLanguageStore';
import { vendorSpacesTranslations } from '../../translations/vendorSpaces';
import { useAuthStore } from '../../store/useAuthStore';

interface Props {
  rental: VendorRental;
  month: number;
  year: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function PayRentModal({ rental, month, year, onClose, onSuccess }: Props) {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const t = vendorSpacesTranslations[language];
  const [amount, setAmount] = useState(() => 
    rental.rent_amount?.toString() || '0'
  );
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'online'>('cash');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const taxAmount = parseFloat(amount);
    
    if (isNaN(taxAmount) || taxAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check if payment already exists for this month
      const exists = await checkExistingPayment(
        rental.owner_business_code,
        rental.vendor_business_code,
        rental.branch_name,
        month,
        year
      );

      if (exists) {
        setError('Payment for this month already exists');
        return;
      }

      // Get owner business name
      const ownerBusinessName = await getBusinessName(rental.owner_business_code);

      // Create rental history record
      const history = await createRentalHistory({
        owner_business_code: rental.owner_business_code,
        vendor_business_code: rental.vendor_business_code,
        vendor_business_name: rental.vendor_business_name,
        branch_name: rental.branch_name,
        month: month,
        year: year,
        tax_amount: taxAmount
      });

      // Record vendor transaction (expense for vendor)
      await recordVendorSpacePayment({
        owner_business_code: rental.owner_business_code,
        owner_business_name: ownerBusinessName,
        vendor_business_code: rental.vendor_business_code,
        vendor_business_name: rental.vendor_business_name,
        branch_name: rental.branch_name,
        amount: taxAmount,
        month: month,
        year: year
      });

      // Create transaction reason based on language
      const transactionReason = language === 'ar'
        ? `دفع إيجار مستلم من ${rental.vendor_business_name} لشهر ${month}/${year}`
        : `Rent payment received from ${rental.vendor_business_name} for ${month}/${year}`;

      // Record business transaction (income for owner)
      await recordBusinessRentalIncome({
        business_code: rental.owner_business_code,
        business_name: ownerBusinessName,
        vendor_code: rental.vendor_business_code,
        vendor_name: rental.vendor_business_name,
        branch_name: rental.branch_name,
        amount: taxAmount,
        payment_method: paymentMethod,
        transaction_reason: transactionReason,
        cashier_name: user?.name || 'Unknown User'
      });

      // Update the payment status to 'paid'
      await updatePaymentStatus(history.id, 'paid');

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error processing payment:', err);
      setError(err?.message || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">{t.pay_rent}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {t.paymentFor}: <span className="font-medium">{rental.vendor_business_name}</span>
              </p>
              <p className="text-sm text-gray-600">
                {t.branch}: <span className="font-medium">{rental.branch_name}</span>
              </p>
              <p className="text-sm text-gray-600">
                {t.space}: <span className="font-medium">{rental.space_name}</span>
              </p>
              <p className="text-sm text-gray-600">
                {t.period}: <span className="font-medium">{new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
              </p>
              <p className="text-sm text-gray-600">
                {t.monthly_rent}: <span className="font-medium">{rental.rent_amount?.toFixed(2) || '0.00'} OMR</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.amount}
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t.enterAmount}
                  required
                  min="0"
                  step="0.01"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.paymentMethod}
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'card' | 'online')}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                  required
                >
                  <option value="cash">{t.cash}</option>
                  <option value="card">{t.card}</option>
                  <option value="online">{t.online}</option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50 disabled:bg-gray-100"
              disabled={loading}
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
              disabled={loading}
            >
              {loading ? t.processing : t.pay}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
