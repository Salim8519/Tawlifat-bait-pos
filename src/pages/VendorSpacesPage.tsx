import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useLanguageStore } from '../store/useLanguageStore';
import { AddSpaceForm } from '../components/vendor-spaces/AddSpaceForm';
import { SpacesList } from '../components/vendor-spaces/SpacesList';
import { RentalHistory } from '../components/vendor-spaces/RentalHistory';
import { RentalStats } from '../components/vendor-spaces/RentalStats';
import { vendorSpacesTranslations } from '../translations/vendorSpaces';
import type { VendorRental } from '../services/vendorRentalsService';

export function VendorSpacesPage() {
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const t = vendorSpacesTranslations[language];
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRental, setEditingRental] = useState<VendorRental | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const handleEdit = (rental: VendorRental) => {
    setEditingRental(rental);
    setShowAddForm(true);
  };

  const handleClose = () => {
    setShowAddForm(false);
    setEditingRental(null);
  };

  const handleSuccess = () => {
    handleClose();
    // Increment counter to trigger refresh of both lists
    setRefreshCounter(prev => prev + 1);
  };

  const handleMonthYearChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  const isRTL = language === 'ar';

  return (
    <div className="p-6 max-w-7xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="space-y-8">
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">{t.title}</h1>
            <button
              onClick={() => {
                setEditingRental(null);
                setShowAddForm(true);
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {t.addNew}
            </button>
          </div>

          <RentalStats 
            businessCode={user?.businessCode || ''}
            month={selectedMonth}
            year={selectedYear}
            refreshTrigger={refreshCounter}
          />
        </div>

        {showAddForm && (
          <div className="mb-8">
            <AddSpaceForm
              businessCode={user?.businessCode || ''}
              onClose={handleClose}
              onSuccess={handleSuccess}
              editingRental={editingRental}
            />
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold mb-4">{t.activeSpaces}</h2>
          <SpacesList
            businessCode={user?.businessCode || ''}
            onEdit={handleEdit}
            onDeleted={handleSuccess}
            refreshTrigger={refreshCounter}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        </div>

        <div>
          <RentalHistory 
            businessCode={user?.businessCode || ''} 
            onMonthYearChange={handleMonthYearChange}
            refreshTrigger={refreshCounter}
          />
        </div>
      </div>
    </div>
  );
}
