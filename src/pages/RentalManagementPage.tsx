import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Building2, Calendar, CreditCard, Plus, ArrowUpDown } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { useLanguageStore } from '../store/useLanguageStore';
import { useAuthStore } from '../store/useAuthStore';
import { getVendorAssignments } from '../services/vendorService';
import { rentalTranslations } from '../translations/rentals';
import { getRentals, createRental, updateRentalPaymentStatus, deleteRental, type VendorRental, type CreateRentalData } from '../services/rentalService';
import type { VendorAssignment } from '../types/vendor';

type SortField = 'space_name' | 'vendor_business_name' | 'branch_name_rental' | 'monthly_rent' | 'payment_status' | 'next_payment_date';
type SortDirection = 'asc' | 'desc';

export function RentalManagementPage() {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const t = rentalTranslations[language];

  const [assignments, setAssignments] = useState<VendorAssignment[]>([]);
  const [rentals, setRentals] = useState<VendorRental[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [filterBranch, setFilterBranch] = useState<string>('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedRental, setSelectedRental] = useState<VendorRental | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<VendorRental | null>(null);
  const [selectedVendorEmail, setSelectedVendorEmail] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [sortField, setSortField] = useState<SortField>('space_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    if (user?.businessCode) {
      loadRentals();
      loadAssignments();
    }
  }, [user?.businessCode]);

  const loadAssignments = async () => {
    try {
      const data = await getVendorAssignments(user!.businessCode);
      setAssignments(data);
    } catch (err) {
      console.error('Error loading assignments:', err);
    }
  };

  const loadRentals = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getRentals(user!.businessCode);
      setRentals(data);
    } catch (err) {
      console.error('Error loading rentals:', err);
      setError(t.errorLoadingRentals);
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique vendors from assignments
  const uniqueVendors = useMemo(() => {
    const vendorsMap = new Map();
    assignments.forEach(assignment => {
      if (!vendorsMap.has(assignment.vendor_email_identifier)) {
        vendorsMap.set(assignment.vendor_email_identifier, {
          email: assignment.vendor_email_identifier,
          name: assignment.profile?.["vendor_business _name"] || '',
          businessCode: assignment.vendor_business_code
        });
      }
    });
    return Array.from(vendorsMap.values());
  }, [assignments]);

  // Get available branches for selected vendor
  const availableBranches = useMemo(() => {
    if (!selectedVendorEmail) return [];
    return assignments
      .filter(a => a.vendor_email_identifier === selectedVendorEmail)
      .map(a => a.branch_name);
  }, [selectedVendorEmail, assignments]);

  // Get vendor details when vendor is selected
  const selectedVendor = useMemo(() => {
    return uniqueVendors.find(v => v.email === selectedVendorEmail);
  }, [selectedVendorEmail, uniqueVendors]);

  const handleAddRental = async (formData: FormData) => {
    try {
      setError(null);
      if (!selectedVendor) {
        throw new Error('Please select a vendor');
      }

      const rentalData: CreateRentalData = {
        space_name: formData.get('space_name') as string,
        vendor_bussnies_code: selectedVendor.businessCode,
        vendor_business_name: selectedVendor.name,
        owner_business_name: user!.businessCode,
        branch_name_rental: selectedBranch,
        monthly_rent: parseFloat(formData.get('monthly_rent') as string),
        next_payment_date: formData.get('next_payment_date') as string
      };

      await createRental(rentalData);
      await loadRentals();
      setShowAddModal(false);
    } catch (err) {
      console.error('Error adding rental:', err);
      setError(t.errorAddingRental);
    }
  };

  const handleUpdatePaymentStatus = async (rental: VendorRental, status: 'paid' | 'pending' | 'overdue') => {
    try {
      setError(null);
      await updateRentalPaymentStatus(rental.rental_id, status);
      await loadRentals();
      setSelectedRental(null);
    } catch (err) {
      console.error('Error updating payment status:', err);
      setError(t.errorUpdatingStatus);
    }
  };

  const handleDeleteRental = async (rental: VendorRental) => {
    try {
      setError(null);
      await deleteRental(rental.rental_id);
      await loadRentals();
      setShowDeleteModal(null);
    } catch (err) {
      console.error('Error deleting rental:', err);
      setError(t.errorDeletingRental);
    }
  };

  // Get unique branches from rentals
  const uniqueBranches = useMemo(() => {
    const branches = new Set<string>();
    rentals.forEach(rental => {
      branches.add(rental.branch_name_rental);
    });
    return Array.from(branches).sort();
  }, [rentals]);

  const filteredRentals = rentals.filter(rental => {
    const matchesSearch = 
      rental.space_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rental.vendor_business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rental.branch_name_rental.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || rental.payment_status === filterStatus;
    const matchesBranch = filterBranch === 'all' || rental.branch_name_rental === filterBranch;

    return matchesSearch && matchesStatus && matchesBranch;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedRentals = useMemo(() => {
    return [...filteredRentals].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'space_name':
          comparison = a.space_name.localeCompare(b.space_name);
          break;
        case 'vendor_business_name':
          comparison = a.vendor_business_name.localeCompare(b.vendor_business_name);
          break;
        case 'branch_name_rental':
          comparison = a.branch_name_rental.localeCompare(b.branch_name_rental);
          break;
        case 'monthly_rent':
          comparison = a.monthly_rent - b.monthly_rent;
          break;
        case 'payment_status':
          comparison = a.payment_status.localeCompare(b.payment_status);
          break;
        case 'next_payment_date':
          comparison = new Date(a.next_payment_date).getTime() - new Date(b.next_payment_date).getTime();
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredRentals, sortField, sortDirection]);

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      scope="col"
      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group"
      onClick={() => handleSort(field)}
      title={sortField === field ? 
        (sortDirection === 'asc' ? t.sortDesc : t.sortAsc) :
        t.sortAsc
      }
    >
      <div className="flex items-center justify-end space-x-1 space-x-reverse">
        <span>{children}</span>
        <ArrowUpDown className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity ${
          sortField === field ? 'opacity-100 text-indigo-500' : 'text-gray-400'
        }`} />
      </div>
    </th>
  );

  const getDaysUntilDue = (nextPaymentDate: string) => {
    const today = new Date();
    const dueDate = new Date(nextPaymentDate);
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getPaymentStatusDisplay = (rental: VendorRental) => {
    const daysUntilDue = getDaysUntilDue(rental.next_payment_date);
    
    if (rental.payment_status === 'overdue') {
      return {
        text: t.paymentOverdue,
        className: 'bg-red-100 text-red-800'
      };
    }
    
    if (daysUntilDue === 0) {
      return {
        text: t.dueToday,
        className: 'bg-yellow-100 text-yellow-800'
      };
    }
    
    if (rental.payment_status === 'paid') {
      return {
        text: t.paidOnTime,
        className: 'bg-green-100 text-green-800'
      };
    }
    
    return {
      text: t.dueIn.replace('{days}', daysUntilDue.toString()),
      className: 'bg-yellow-100 text-yellow-800'
    };
  };

  const overduePayments = rentals.filter(rental => rental.payment_status === 'overdue').length;
  const totalRentedSpaces = rentals.length;
  const totalPaidRentals = rentals.filter(rental => rental.payment_status === 'paid').length;

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.rentalManagement}</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center"
        >
          <Plus className="w-5 h-5 ml-2" />
          {t.addRental}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-indigo-100 p-3 rounded-full">
              <Building2 className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="mr-4">
              <h3 className="text-lg font-semibold">{t.rentedSpaces}</h3>
              <p className="text-3xl font-bold mt-1">{totalRentedSpaces}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full">
              <Building2 className="w-6 h-6 text-green-600" />
            </div>
            <div className="mr-4">
              <h3 className="text-lg font-semibold">{t.paidRentals}</h3>
              <p className="text-3xl font-bold mt-1">{totalPaidRentals}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="bg-red-100 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-red-600" />
            </div>
            <div className="mr-4">
              <h3 className="text-lg font-semibold">{t.overduePayments}</h3>
              <p className="text-3xl font-bold mt-1">{overduePayments}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchSpace}
                className="w-full pr-10 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              <option value="all">{t.selectAllBranches}</option>
              {uniqueBranches.map(branch => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              <option value="all">{t.allSpaces}</option>
              <option value="paid">{t.paidRentals}</option>
              <option value="pending">{t.pendingPayments}</option>
              <option value="overdue">{t.overduePayments}</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">{t.loading}</p>
            </div>
          ) : filteredRentals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchQuery ? t.noSearchResults : t.noRentals}
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <SortableHeader field="space_name">
                    {t.space}
                  </SortableHeader>
                  <SortableHeader field="vendor_business_name">
                    {t.vendor}
                  </SortableHeader>
                  <SortableHeader field="branch_name_rental">
                    {t.branchTitle}
                  </SortableHeader>
                  <SortableHeader field="monthly_rent">
                    {t.monthlyRent}
                  </SortableHeader>
                  <SortableHeader field="payment_status">
                    {t.paymentStatus}
                  </SortableHeader>
                  <SortableHeader field="next_payment_date">
                    {t.nextPaymentDate}
                  </SortableHeader>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">{t.actions}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedRentals.map((rental) => {
                  const status = getPaymentStatusDisplay(rental);
                  return (
                    <tr key={rental.rental_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {rental.space_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {rental.vendor_business_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {rental.branch_name_rental}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {rental.monthly_rent.toFixed(3)} {t.currency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.className}`}>
                          {status.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(rental.next_payment_date).toLocaleDateString(
                          'en-US',
                          { year: 'numeric', month: '2-digit', day: '2-digit' }
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedRental(rental);
                            setShowPaymentModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 ml-4"
                        >
                          {t.updatePayment}
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(rental)}
                          className="text-red-600 hover:text-red-900"
                        >
                          {t.delete}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedRental && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {t.updatePayment} - {selectedRental.space_name}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.currentStatus}
                </label>
                <div className={`inline-flex px-2 py-1 rounded-full text-sm ${
                  selectedRental.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
                  selectedRental.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {t[selectedRental.payment_status]}
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => handleUpdatePaymentStatus(selectedRental, 'paid')}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  {t.markAsPaid}
                </button>
                <button
                  onClick={() => handleUpdatePaymentStatus(selectedRental, 'pending')}
                  className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                >
                  {t.markAsPending}
                </button>
                <button
                  onClick={() => handleUpdatePaymentStatus(selectedRental, 'overdue')}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  {t.markAsOverdue}
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedRental(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  {t.close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Rental Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-semibold mb-4">{t.addRental}</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddRental(new FormData(e.currentTarget));
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.spaceName} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="space_name"
                  required
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.vendor} <span className="text-red-500">*</span></label>
                <select
                  value={selectedVendorEmail}
                  onChange={(e) => {
                    setSelectedVendorEmail(e.target.value);
                    setSelectedBranch(''); // Reset branch when vendor changes
                  }}
                  required
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                >
                  <option value="">{t.selectVendor}</option>
                  {uniqueVendors.map(vendor => (
                    <option key={vendor.email} value={vendor.email}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.branchName} <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  required
                  disabled={!selectedVendorEmail}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                >
                  <option value="">{t.selectBranch}</option>
                  {availableBranches.map(branch => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.monthlyRent} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="monthly_rent"
                  required
                  min="0"
                  step="0.001"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.nextPaymentDate} <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="next_payment_date"
                  required
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  dir="ltr"
                />
              </div>

              <div className="flex justify-end space-x-2 space-x-reverse">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">{t.confirmDelete}</h2>
            <p className="text-gray-600 mb-6">
              {t.deleteConfirmMessage.replace('{name}', showDeleteModal.space_name)}
            </p>
            
            <div className="flex justify-end space-x-2 space-x-reverse">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => handleDeleteRental(showDeleteModal)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                {t.confirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}