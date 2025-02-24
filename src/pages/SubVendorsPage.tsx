import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Store, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { useAuthStore } from '../store/useAuthStore';
import { useBusinessStore } from '../store/useBusinessStore';
import { subVendorTranslations } from '../translations/subVendors';
import { getVendorAssignments, checkVendorEmail, assignVendor, removeVendorAssignment, createVendor, getAllVendors } from '../services/vendorService';

interface VendorAssignment {
  assignment_id: number;
  vendor_business_code: string;
  owner_business_code: string;
  owner_business_name: string;
  branch_name: string;
  date_of_assignment: string;
  vendor_email_identifier: string;
}

interface VendorProfile {
  user_id: string;
  full_name: string;
  phone_number: string;
  vendor_business_name: string;
  his_email: string;
}

export function SubVendorsPage() {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const { branches } = useBusinessStore();
  const t = subVendorTranslations[language];

  const [vendors, setVendors] = useState<VendorAssignment[]>([]);
  const [availableVendors, setAvailableVendors] = useState<VendorProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [showNewVendorForm, setShowNewVendorForm] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<VendorProfile | null>(null);
  const [newVendorData, setNewVendorData] = useState<{
    full_name: string;
    phone_number: string;
    vendor_business_name: string;
    password: string;
  }>({
    full_name: '',
    phone_number: '',
    vendor_business_name: '',
    password: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [removingVendor, setRemovingVendor] = useState<VendorAssignment | null>(null);

  useEffect(() => {
    if (user?.businessCode) {
      loadVendors();
      loadAvailableVendors();
    }
  }, [user?.businessCode]);

  const loadVendors = async () => {
    try {
      setIsLoading(true);
      const data = await getVendorAssignments(user!.businessCode);
      setVendors(data);
    } catch (error) {
      console.error('Error loading vendors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailableVendors = async () => {
    try {
      const data = await getAllVendors();
      setAvailableVendors(data);
    } catch (error) {
      console.error('Error loading available vendors:', error);
    }
  };

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!selectedBranch) {
      setError(t.selectBranchFirst);
      return;
    }

    try {
      if (selectedVendor) {
        // Use selected vendor's information
        await assignVendor({
          vendor_business_code: selectedVendor.business_code,
          owner_business_code: user!.businessCode,
          owner_business_name: '',
          branch_name: selectedBranch,
          vendor_email_identifier: selectedVendor.his_email || ''
        });
      } else if (showNewVendorForm) {
        // Create new vendor
        const newVendor = await createVendor({
          email: vendorEmail,
          password: newVendorData.password,
          full_name: newVendorData.full_name,
          vendor_business_name: newVendorData.vendor_business_name,
          phone_number: newVendorData.phone_number
        });

        await assignVendor({
          vendor_business_code: newVendor.business_code,
          owner_business_code: user!.businessCode,
          owner_business_name: '',
          branch_name: selectedBranch,
          vendor_email_identifier: vendorEmail
        });
      } else {
        const vendorData = await checkVendorEmail(vendorEmail);
        
        if (!vendorData) {
          setShowNewVendorForm(true);
          return;
        }      
        
        await assignVendor({
          vendor_business_code: vendorData.business_code,
          owner_business_code: user!.businessCode,
          owner_business_name: '',
          branch_name: selectedBranch,
          vendor_email_identifier: vendorEmail
        });
      }

      await loadVendors();
      setShowAddModal(false);
      setVendorEmail('');
      setSelectedBranch('');
      setShowNewVendorForm(false);
      setSelectedVendor(null);
      setNewVendorData({ full_name: '', phone_number: '', vendor_business_name: '', password: '' });
    } catch (error) {
      console.error('Error adding vendor:', error);
      setError(t.errorAddingVendor);
    }
  };

  const handleRemoveVendor = async (vendor: VendorAssignment) => {
    try {
      await removeVendorAssignment(vendor.assignment_id);
      await loadVendors();
      setRemovingVendor(null);
    } catch (error) {
      console.error('Error removing vendor:', error);
    }
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.vendor_email_identifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.branch_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());

  const toggleVendor = (email: string) => {
    setExpandedVendors(prev => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
  };

  // Group vendors by email
  const groupedVendors = useMemo(() => {
    const groups = new Map<string, VendorAssignment[]>();
    vendors.forEach(vendor => {
      const existing = groups.get(vendor.vendor_email_identifier) || [];
      groups.set(vendor.vendor_email_identifier, [...existing, vendor]);
    });
    return groups;
  }, [vendors]);

  return (
    <div className="space-y-8 p-6 bg-gray-50" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-800">{t.subVendors}</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-offset-2 flex items-center text-lg font-semibold shadow-lg"
        >
          <Plus className="w-6 h-6 ml-2" />
          {t.addVendor}
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchVendor}
              className="w-full pr-10 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">{t.loading}</p>
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">{t.noVendors}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {Array.from(groupedVendors.entries()).map(([email, assignments]) => {
                const isExpanded = expandedVendors.has(email);
                return (
                  <div key={email} className="bg-white hover:bg-blue-50 transition-colors duration-150">
                    <div 
                      className="px-8 py-6 cursor-pointer flex items-center justify-between border-l-4 border-blue-500"
                      onClick={() => toggleVendor(email)}
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-16 w-16">
                          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center shadow-inner">
                            <Store className="h-8 w-8 text-blue-600" />
                          </div>
                        </div>
                        <div className="mr-6">
                          <div className="text-xl font-bold text-blue-700">
                            {assignments[0].profile?.["vendor_business _name"] || t.unknownBusiness}
                          </div>
                          <div className="text-lg text-gray-600 mt-1">
                            {email}
                          </div>
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-8 w-8 text-blue-600" />
                      ) : (
                        <ChevronDown className="h-8 w-8 text-blue-600" />
                      )}
                    </div>
                    
                    {isExpanded && (
                      <div className="border-t-2 border-gray-100 bg-blue-50">
                        <div className="px-8 py-4">
                          <div className="grid grid-cols-2 gap-6">
                            <div className="bg-white p-4 rounded-lg shadow-sm">
                              <label className="text-sm font-semibold text-gray-600">{t.phone}</label>
                              <p className="text-lg text-gray-900 mt-1 font-medium">
                                {availableVendors.find(v => v.his_email === email)?.phone_number || '-'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <table className="min-w-full divide-y-2 divide-blue-100">
                          <thead className="bg-blue-50">
                            <tr>
                              <th scope="col" className="px-8 py-4 text-right text-sm font-bold text-blue-900 uppercase tracking-wider border-b-2 border-blue-200">
                                {t.branch}
                              </th>
                              <th scope="col" className="px-8 py-4 text-right text-sm font-bold text-blue-900 uppercase tracking-wider border-b-2 border-blue-200">
                                {t.assignmentDate}
                              </th>
                              <th scope="col" className="relative px-8 py-4 border-b-2 border-blue-200">
                                <span className="sr-only">{t.actions}</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-blue-100">
                            {assignments.map((assignment) => (
                              <tr key={assignment.assignment_id} className="hover:bg-blue-50 transition-colors duration-150">
                                <td className="px-8 py-5 whitespace-nowrap text-lg text-gray-900 font-medium border-r border-blue-100">
                                  {assignment.branch_name}
                                </td>
                                <td className="px-8 py-5 whitespace-nowrap text-lg text-gray-600 border-r border-blue-100">
                                  {new Date(assignment.date_of_assignment).toLocaleDateString(
                                    language === 'ar' ? 'ar' : 'en-US',
                                    { dateStyle: 'medium' }
                                  )}
                                </td>
                                <td className="px-8 py-5 whitespace-nowrap text-left text-lg font-medium">
                                  <button
                                    onClick={() => setRemovingVendor(assignment)}
                                    className="text-red-600 hover:text-red-800 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500"
                                  >
                                    {t.remove}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Vendor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {showNewVendorForm ? t.newVendorDetails : t.addVendor}
            </h2>
            
            <form onSubmit={handleAddVendor} className="space-y-4">
              {!showNewVendorForm && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.selectExistingVendor}
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    value={selectedVendor?.user_id || ''}
                    onChange={(e) => {
                      const vendor = availableVendors.find(v => v.user_id === e.target.value);
                      setSelectedVendor(vendor || null);
                      if (vendor) {
                        setVendorEmail(vendor.his_email || '');
                      }
                    }}
                  >
                    <option value="">{t.selectVendor}</option>
                    {availableVendors.map(vendor => (
                      <option key={vendor.user_id} value={vendor.user_id}>
                        {vendor["vendor_business _name"] || vendor.full_name}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2">
                    <span className="text-sm text-gray-500">{t.or}</span>
                  </div>
                </div>
              )}

              {!selectedVendor && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.vendorEmail}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={vendorEmail}
                    onChange={(e) => setVendorEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm p-2"
                    required
                  />
                </div>
              )}

              {!showNewVendorForm && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.branch} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  >
                    <option value="">{t.selectBranch}</option>
                    {branches.filter(branch => branch.is_active).map(branch => (
                      <option key={branch.branch_id} value={branch.branch_name}>
                        {branch.branch_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {showNewVendorForm && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.vendorBusinessName} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newVendorData.vendor_business_name}
                      onChange={(e) => setNewVendorData(prev => ({
                        ...prev,
                        vendor_business_name: e.target.value
                      }))}
                      required
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.vendorName} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newVendorData.full_name}
                      onChange={(e) => setNewVendorData(prev => ({
                        ...prev,
                        full_name: e.target.value
                      }))}
                      required
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.phoneNumber} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={newVendorData.phone_number}
                      onChange={(e) => setNewVendorData(prev => ({
                        ...prev,
                        phone_number: e.target.value
                      }))}
                      required
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t.password} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={newVendorData.password}
                      onChange={(e) => setNewVendorData(prev => ({
                        ...prev,
                        password: e.target.value
                      }))}
                      required
                      minLength={6}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      dir="ltr"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      {t.passwordHint}
                    </p>
                  </div>
                </>
              )}

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="mr-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 space-x-reverse">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setError(null);
                    setShowNewVendorForm(false);
                    setNewVendorData({ full_name: '', phone_number: '', vendor_business_name: '', password: '' });
                    setSelectedBranch('');
                    setSelectedVendor(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  {showNewVendorForm ? t.createAndAssign : t.add}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {removingVendor && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">{t.confirmRemove}</h2>
            <p className="text-gray-600 mb-6">
              {t.removeConfirmationMessage}
            </p>
            
            <div className="flex justify-end space-x-2 space-x-reverse">
              <button
                onClick={() => setRemovingVendor(null)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => handleRemoveVendor(removingVendor)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}