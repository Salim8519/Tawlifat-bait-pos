import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Edit, Trash2, CreditCard } from 'lucide-react';
import { getVendorRentals, deleteVendorRental, type VendorRental } from '../../services/vendorRentalsService';
import { PayRentModal } from './PayRentModal';
import { useLanguageStore } from '../../store/useLanguageStore';
import { vendorSpacesTranslations } from '../../translations/vendorSpaces';
import { supabase } from '../../lib/supabase';

interface Props {
  businessCode: string;
  onEdit?: (rental: VendorRental) => void;
  onDeleted?: () => void;
  refreshTrigger?: number;
  selectedMonth: number;
  selectedYear: number;
}

export function SpacesList({ 
  businessCode, 
  onEdit, 
  onDeleted, 
  refreshTrigger = 0,
  selectedMonth,
  selectedYear 
}: Props) {
  const { language } = useLanguageStore();
  const t = vendorSpacesTranslations[language];
  const [rentals, setRentals] = useState<VendorRental[]>([]);
  const [paidRentals, setPaidRentals] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [payingRental, setPayingRental] = useState<VendorRental | null>(null);

  const loadRentals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all rentals
      const data = await getVendorRentals(businessCode);
      setRentals(data);

      // Get paid rentals for current month
      const { data: paidHistory } = await supabase
        .from('vendor_rentals_history')
        .select('vendor_business_code, branch_name')
        .eq('owner_business_code', businessCode)
        .eq('month', selectedMonth)
        .eq('year', selectedYear)
        .eq('payment_status', 'paid');

      // Create a Set of paid rental keys
      const paidKeys = new Set(
        (paidHistory || []).map(h => 
          `${h.vendor_business_code}-${h.branch_name}`
        )
      );
      setPaidRentals(paidKeys);

    } catch (err) {
      console.error('Error loading rentals:', err);
      setError('Failed to load vendor spaces');
    } finally {
      setLoading(false);
    }
  }, [businessCode, selectedMonth, selectedYear]);

  useEffect(() => {
    loadRentals();
  }, [loadRentals, refreshTrigger]);

  const isRentalPaid = (rental: VendorRental) => {
    return paidRentals.has(`${rental.vendor_business_code}-${rental.branch_name}`);
  };

  const handleDelete = async (rentalId: number) => {
    if (!confirm('Are you sure you want to delete this space?')) return;

    try {
      setDeletingId(rentalId);
      await deleteVendorRental(rentalId);
      setRentals(rentals.filter(r => r.rental_id !== rentalId));
      onDeleted?.();
    } catch (err) {
      console.error('Error deleting rental:', err);
      setError('Failed to delete space');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading && rentals.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="flex items-center justify-center p-6">
          <div className="text-gray-600">{t.loading}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 text-red-600 flex justify-between items-center">
          <span>{error}</span>
          <button 
            onClick={() => loadRentals()}
            className="text-sm bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className={`px-6 py-3 ${language === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4`}>
                  {t.vendor}
                </th>
                <th scope="col" className={`px-6 py-3 ${language === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6`}>
                  {t.branch}
                </th>
                <th scope="col" className={`px-6 py-3 ${language === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6`}>
                  {t.spaceName}
                </th>
                <th scope="col" className={`px-6 py-3 ${language === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6`}>
                  {t.monthlyRent}
                </th>
                <th scope="col" className={`px-6 py-3 ${language === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6`}>
                  {t.assignedDate}
                </th>
                <th scope="col" className={`px-6 py-3 ${language === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 uppercase tracking-wider w-28`}>
                  {t.actions}
                </th>
              </tr>
            </thead>
            <tbody className={`bg-white divide-y divide-gray-200 ${loading ? 'opacity-50' : ''}`}>
              {rentals.map((rental) => (
                <tr key={rental.rental_id} className="hover:bg-gray-50">
                  <td className={`px-6 py-4 whitespace-nowrap ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <div className="text-sm font-medium text-gray-900">
                      {rental.vendor_business_name}
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <div className="text-sm text-gray-900">{rental.branch_name}</div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <div className="text-sm text-gray-900">{rental.space_name}</div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <div className="text-sm font-medium text-gray-900">
                      {rental.rent_amount?.toFixed(2) || '0.00'} OMR
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <div className="text-sm text-gray-900">
                      {format(new Date(rental.created_at), 'MMM d, yyyy')}
                    </div>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                    <div className={`flex ${language === 'ar' ? 'justify-end space-x-reverse' : 'justify-start'} space-x-2`}>
                      <button
                        onClick={() => onEdit?.(rental)}
                        className="px-3 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-full hover:bg-indigo-100 disabled:opacity-50"
                        title={t.edit}
                        disabled={loading}
                      >
                        {t.edit}
                      </button>
                      <button
                        onClick={() => handleDelete(rental.rental_id)}
                        className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 rounded-full hover:bg-red-100 disabled:opacity-50"
                        title={t.delete}
                        disabled={deletingId === rental.rental_id || loading}
                      >
                        {t.delete}
                      </button>
                      {!isRentalPaid(rental) && (
                        <button
                          onClick={() => setPayingRental(rental)}
                          className="px-3 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-full hover:bg-green-100 disabled:opacity-50"
                          title={t.payRent}
                          disabled={loading}
                        >
                          {t.pay}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {rentals.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    {t.noSpacesFound}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {payingRental && (
        <PayRentModal
          rental={payingRental}
          month={selectedMonth}
          year={selectedYear}
          onClose={() => setPayingRental(null)}
          onSuccess={() => {
            setPayingRental(null);
            onDeleted?.();
          }}
        />
      )}
    </>
  );
}
