import React, { useState } from 'react';
import { Search, Store, Package, Star } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { multiVendorTranslations } from '../translations/multiVendor';
import type { Product } from '../types/pos';

interface Vendor {
  id: string;
  name: string;
  description: string;
  logo?: string;
  rating: number;
  totalProducts: number;
  location: string;
  type: 'food' | 'non-food' | 'both';
  isOpen: boolean;
  openingHours: {
    open: string;
    close: string;
  };
  products: Product[];
}

// Mock data - replace with API calls
const mockVendors: Vendor[] = [
  {
    id: '1',
    name: 'سوبرماركت السعادة',
    description: 'أفضل المنتجات الطازجة والمواد الغذائية',
    rating: 4.5,
    totalProducts: 150,
    location: 'المعبيلة الجنوبية',
    type: 'both',
    isOpen: true,
    openingHours: {
      open: '08:00',
      close: '22:00'
    },
    products: [
      {
        id: '1',
        nameAr: 'تفاح أحمر',
        type: 'food',
        price: 2.99,
        quantity: 100,
        category: 'فواكه',
        imageUrl: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6',
        expiryDate: '2024-03-20'
      },
      {
        id: '2',
        nameAr: 'عصير برتقال',
        type: 'food',
        price: 1.99,
        quantity: 50,
        category: 'مشروبات',
        imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba',
        expiryDate: '2024-03-15'
      }
    ]
  },
  {
    id: '2',
    name: 'متجر البركة',
    description: 'منتجات منزلية ومستلزمات يومية',
    rating: 4.2,
    totalProducts: 200,
    location: 'الخوض',
    type: 'non-food',
    isOpen: true,
    openingHours: {
      open: '09:00',
      close: '23:00'
    },
    products: [
      {
        id: '3',
        nameAr: 'منظف متعدد الأغراض',
        type: 'non-food',
        price: 4.99,
        quantity: 30,
        category: 'منظفات',
        imageUrl: 'https://images.unsplash.com/photo-1585342565162-3704ff9b221d'
      }
    ]
  }
];

export function MultiVendorPage() {
  const { language } = useLanguageStore();
  const t = multiVendorTranslations[language];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'food' | 'non-food'>('all');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const filteredVendors = mockVendors.filter(vendor => {
    const matchesSearch = 
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'all' || 
      vendor.type === selectedType || 
      vendor.type === 'both';

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.vendors}</h1>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as typeof selectedType)}
            className="border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            <option value="all">{t.allVendors}</option>
            <option value="food">{t.foodVendors}</option>
            <option value="non-food">{t.nonFoodVendors}</option>
          </select>
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVendors.map((vendor) => (
          <div
            key={vendor.id}
            className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => setSelectedVendor(vendor)}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Store className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="mr-4">
                    <h3 className="text-lg font-semibold">{vendor.name}</h3>
                    <p className="text-sm text-gray-500">{vendor.location}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="mr-1 text-sm font-medium">{vendor.rating}</span>
                </div>
              </div>

              <p className="text-gray-600 mb-4">{vendor.description}</p>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span className="flex items-center">
                  <Package className="h-4 w-4 ml-1" />
                  {vendor.totalProducts} {t.products}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  vendor.isOpen 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {vendor.isOpen ? t.open : t.closed}
                </span>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t">
              <div className="flex justify-between text-sm">
                <span>{t.openingHours}:</span>
                <span className="font-medium">
                  {vendor.openingHours.open} - {vendor.openingHours.close}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Vendor Details Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedVendor.name}</h2>
                  <p className="text-gray-600">{selectedVendor.description}</p>
                </div>
                <button
                  onClick={() => setSelectedVendor(null)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedVendor.products.map((product) => (
                  <div key={product.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="aspect-w-16 aspect-h-9 mb-4">
                      <img
                        src={product.imageUrl}
                        alt={product.nameAr}
                        className="rounded-lg object-cover w-full h-48"
                      />
                    </div>
                    <h3 className="font-semibold mb-2">{product.nameAr}</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-indigo-600 font-bold">
                        {product.price} {t.currency}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        product.type === 'food' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {product.type === 'food' ? t.food : t.nonFood}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}