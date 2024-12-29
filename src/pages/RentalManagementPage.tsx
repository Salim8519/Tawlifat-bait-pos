import React, { useState } from 'react';
import { Search, Filter, Building2, Calendar, CreditCard } from 'lucide-react';
import { format, addMonths } from 'date-fns';
import { useLanguageStore } from '../store/useLanguageStore';
import { rentalTranslations } from '../translations/rentals';

interface Vendor {
  id: string;
  name: string;
  phone: string;
  email: string;
}

interface PaymentStatus {
  lastPaymentDate: string | null;
  nextPaymentDate: string;
  isOverdue: boolean;
  daysUntilDue: number;
}

interface RentalSpace {
  id: string;
  name: string;
  description: string;
  type: 'shelf' | 'corner' | 'space';
  location: string;
  monthlyRent: number;
  isOccupied: boolean;
  currentVendor: Vendor | null;
  paymentStatus: PaymentStatus;
}

// Mock vendors data
const mockVendors: Vendor[] = [
  {
    id: '1',
    name: 'أحمد محمد',
    phone: '96812345678',
    email: 'ahmed@example.com'
  },
  {
    id: '2',
    name: 'فاطمة علي',
    phone: '96887654321',
    email: 'fatima@example.com'
  }
];

// Mock rental spaces data
const mockSpaces: RentalSpace[] = [
  {
    id: '1',
    name: 'رف A1',
    description: 'رف عرض رئيسي',
    type: 'shelf',
    location: 'المدخل الرئيسي',
    monthlyRent: 100,
    isOccupied: true,
    currentVendor: mockVendors[0],
    paymentStatus: {
      lastPaymentDate: format(new Date(2024, 1, 15), 'yyyy-MM-dd'),
      nextPaymentDate: format(addMonths(new Date(2024, 1, 15), 1), 'yyyy-MM-dd'),
      isOverdue: false,
      daysUntilDue: 5
    }
  },
  {
    id: '2',
    name: 'ركن B2',
    description: 'ركن عرض كبير',
    type: 'corner',
    location: 'الطابق الأول',
    monthlyRent: 150,
    isOccupied: true,
    currentVendor: mockVendors[1],
    paymentStatus: {
      lastPaymentDate: format(new Date(2024, 0, 15), 'yyyy-MM-dd'),
      nextPaymentDate: format(addMonths(new Date(2024, 0, 15), 1), 'yyyy-MM-dd'),
      isOverdue: true,
      daysUntilDue: -15
    }
  },
  {
    id: '3',
    name: 'مساحة C3',
    description: 'مساحة عرض متوسطة',
    type: 'space',
    location: 'الطابق الثاني',
    monthlyRent: 200,
    isOccupied: false,
    currentVendor: null,
    paymentStatus: {
      lastPaymentDate: null,
      nextPaymentDate: format(new Date(2024, 2, 1), 'yyyy-MM-dd'),
      isOverdue: false,
      daysUntilDue: 15
    }
  }
];

export function RentalManagementPage() {
  const { language } = useLanguageStore();
  const t = rentalTranslations[language];

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'occupied' | 'available'>('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSpaceForPayment, setSelectedSpaceForPayment] = useState<RentalSpace | null>(null);

  const filteredSpaces = mockSpaces.filter(space => {
    const matchesSearch = 
      space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      space.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      space.currentVendor?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'occupied' && space.isOccupied) ||
      (filterStatus === 'available' && !space.isOccupied);

    return matchesSearch && matchesStatus;
  });

  const handleAddPayment = (spaceId: string, formData: FormData) => {
    console.log('Adding payment for space:', spaceId, Object.fromEntries(formData));
    setShowPaymentModal(false);
    setSelectedSpaceForPayment(null);
  };

  const getPaymentStatusDisplay = (status: PaymentStatus) => {
    if (status.isOverdue) {
      return {
        text: t.paymentOverdue,
        className: 'bg-red-100 text-red-800'
      };
    }
    if (status.daysUntilDue === 0) {
      return {
        text: t.dueToday,
        className: 'bg-yellow-100 text-yellow-800'
      };
    }
    if (status.daysUntilDue > 0) {
      return {
        text: t.dueIn.replace('{days}', status.daysUntilDue.toString()),
        className: 'bg-green-100 text-green-800'
      };
    }
    return {
      text: t.paidOnTime,
      className: 'bg-green-100 text-green-800'
    };
  };

  const overduePayments = mockSpaces.filter(space => 
    space.isOccupied && space.paymentStatus.isOverdue
  ).length;

  const totalRentedSpaces = mockSpaces.filter(space => space.isOccupied).length;
  const totalAvailableSpaces = mockSpaces.filter(space => !space.isOccupied).length;

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.rentalManagement}</h1>
      </div>

      {/* Stats */}
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
              <h3 className="text-lg font-semibold">{t.availableSpaces}</h3>
              <p className="text-3xl font-bold mt-1">{totalAvailableSpaces}</p>
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

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              <option value="all">{t.allSpaces}</option>
              <option value="occupied">{t.occupiedSpaces}</option>
              <option value="available">{t.availableSpaces}</option>
            </select>
          </div>
        </div>

        {/* Rental Spaces Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.space}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.vendor}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.monthlyRent}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.paymentStatus}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.nextPaymentDate}
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">{t.actions}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSpaces.map((space) => {
                const paymentStatus = getPaymentStatusDisplay(space.paymentStatus);
                return (
                  <tr key={space.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{space.name}</div>
                      <div className="text-sm text-gray-500">{space.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {space.currentVendor ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {space.currentVendor.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {space.currentVendor.phone}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">{t.available}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {space.monthlyRent} {t.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${paymentStatus.className}`}>
                        {paymentStatus.text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(space.paymentStatus.nextPaymentDate).toLocaleDateString(
                        language === 'ar' ? 'ar' : 'en-US',
                        { 
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        }
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {space.isOccupied && (
                        <button
                          onClick={() => {
                            setSelectedSpaceForPayment(space);
                            setShowPaymentModal(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 ml-4"
                        >
                          {t.addPayment}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedSpaceForPayment && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {t.addPayment} - {selectedSpaceForPayment.name}
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddPayment(selectedSpaceForPayment.id, new FormData(e.currentTarget));
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.paymentAmount} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="amount"
                    defaultValue={selectedSpaceForPayment.monthlyRent}
                    required
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.paymentDate} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="paymentDate"
                    required
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.paymentMethod} <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="paymentMethod"
                    required
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  >
                    <option value="bank">{t.bankTransfer}</option>
                    <option value="cash">{t.cash}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t.paymentNotes}
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  />
                </div>

                <div className="flex justify-end space-x-2 space-x-reverse">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setSelectedSpaceForPayment(null);
                    }}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    {t.confirmPayment}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}