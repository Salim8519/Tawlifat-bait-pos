import { useState, useEffect, useMemo } from 'react';
import { getVendorAssignments } from '../../services/vendorService';
import { createVendorRental, updateVendorRental, type VendorRental } from '../../services/vendorRentalsService';
import { useLanguageStore } from '../../store/useLanguageStore';
import { vendorSpacesTranslations } from '../../translations/vendorSpaces';
import type { VendorAssignment } from '../../types/vendor';

interface Props {
  businessCode: string;
  onClose: () => void;
  onSuccess?: () => void;
  editingRental?: VendorRental | null;
}

export function AddSpaceForm({ businessCode, onClose, onSuccess, editingRental }: Props) {
  const { language } = useLanguageStore();
  const t = vendorSpacesTranslations[language];
  const [vendors, setVendors] = useState<VendorAssignment[]>([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [spaceName, setSpaceName] = useState('');
  const [rentAmount, setRentAmount] = useState('0');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isRTL = language === 'ar';

  // Initialize form with editing data
  useEffect(() => {
    if (editingRental) {
      setSelectedVendor(editingRental.vendor_business_code);
      setSelectedBranch(editingRental.branch_name);
      setSpaceName(editingRental.space_name);
      setRentAmount(editingRental.rent_amount?.toString() || '0');
    } else {
      // Reset form when not editing
      setSelectedVendor('');
      setSelectedBranch('');
      setSpaceName('');
      setRentAmount('0');
    }
  }, [editingRental]);

  useEffect(() => {
    loadVendors();
  }, [businessCode]);

  useEffect(() => {
    if (!editingRental) {
      setSelectedBranch('');
    }
    setError(null);
  }, [selectedVendor, editingRental]);

  const loadVendors = async () => {
    try {
      setLoading(true);
      setError(null);
      const assignments = await getVendorAssignments(businessCode);
      setVendors(assignments);
    } catch (err) {
      setError(t.errorLoadingVendors);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendor || !selectedBranch || !spaceName) return;

    const amount = parseFloat(rentAmount);
    if (isNaN(amount) || amount < 0) {
      setError(t.errorInvalidAmount);
      return;
    }

    const selectedVendorData = vendors.find(v => 
      v.vendor_business_code === selectedVendor && 
      v.branch_name === selectedBranch
    );
    
    if (!selectedVendorData) {
      setError(t.errorVendorNotFound);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (editingRental) {
        await updateVendorRental(editingRental.rental_id, {
          vendor_business_code: selectedVendor,
          vendor_business_name: selectedVendorData.profile?.vendor_business_name || 'Unknown',
          space_name: spaceName.trim(),
          branch_name: selectedBranch,
          rent_amount: amount
        });
      } else {
        await createVendorRental({
          owner_business_code: businessCode,
          vendor_business_code: selectedVendor,
          vendor_business_name: selectedVendorData.profile?.vendor_business_name || 'Unknown',
          space_name: spaceName.trim(),
          branch_name: selectedBranch,
          rent_amount: amount
        });
      }
      
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error('Error saving vendor rental:', err);
      setError(err?.message || t.errorSavingSpace);
    } finally {
      setSaving(false);
    }
  };

  const vendorBranches = useMemo(() => {
    return vendors
      .filter(v => v.vendor_business_code === selectedVendor)
      .map(v => v.branch_name);
  }, [vendors, selectedVendor]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
        <div className="flex items-center justify-center py-4">
          <div className="text-gray-600">{t.loading}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <h2 className="text-xl font-bold mb-4">
        {editingRental ? t.editSpace : t.addNew}
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={`block text-sm font-medium mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t.selectVendor}
          </label>
          <select
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
            className={`w-full p-2 border rounded ${isRTL ? 'text-right' : 'text-left'}`}
            required
            disabled={editingRental !== null}
          >
            <option value="">{t.selectVendorPlaceholder}</option>
            {[...new Set(vendors.map(v => v.vendor_business_code))].map((vendorCode) => {
              const vendor = vendors.find(v => v.vendor_business_code === vendorCode);
              return (
                <option 
                  key={vendorCode} 
                  value={vendorCode}
                  className="py-2"
                >
                  {vendor?.profile?.vendor_business_name || t.unknown}
                </option>
              );
            })}
          </select>
        </div>

        {selectedVendor && (
          <>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.vendorName}
              </label>
              <input
                type="text"
                value={vendors.find(v => v.vendor_business_code === selectedVendor)?.profile?.vendor_business_name || t.unknown}
                className={`w-full p-2 border rounded bg-gray-100 ${isRTL ? 'text-right' : 'text-left'}`}
                disabled
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.selectBranch}
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className={`w-full p-2 border rounded ${isRTL ? 'text-right' : 'text-left'}`}
                required
                disabled={editingRental !== null}
              >
                <option value="">{t.selectBranchPlaceholder}</option>
                {vendorBranches.map((branchName) => (
                  <option 
                    key={branchName} 
                    value={branchName}
                    className="py-2"
                  >
                    {branchName}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {selectedBranch && (
          <>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.spaceName}
              </label>
              <input
                type="text"
                value={spaceName}
                onChange={(e) => setSpaceName(e.target.value)}
                className={`w-full p-2 border rounded ${isRTL ? 'text-right' : 'text-left'}`}
                required
                placeholder={t.enterSpaceName}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.monthlyRent}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={rentAmount}
                  onChange={(e) => setRentAmount(e.target.value)}
                  className={`w-full p-2 border rounded ${isRTL ? 'text-right pr-12' : 'text-left pl-12'}`}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
                <span className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-2 text-gray-500`}>OMR</span>
              </div>
            </div>
          </>
        )}

        <div className={`flex justify-end space-x-2 mt-6 ${isRTL ? 'space-x-reverse' : ''}`}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100 disabled:bg-gray-50 disabled:text-gray-400"
            disabled={saving}
          >
            {t.cancel}
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed"
            disabled={!selectedVendor || !selectedBranch || !spaceName || saving}
          >
            {saving ? t.saving : editingRental ? t.update : t.save}
          </button>
        </div>
      </form>
    </div>
  );
}
