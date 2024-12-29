import React, { useState } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { useAuthStore } from '../store/useAuthStore';
import { useVendorStore } from '../store/useVendorStore';
import { productTranslations } from '../translations/products';
import { ProductFilters } from '../components/vendor/ProductFilters';
import { ProductGrid } from '../components/vendor/ProductGrid';
import { ProductFormModal } from '../components/vendor/ProductFormModal';
import type { Product } from '../types/pos';

export function SubVendorProductsPage() {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const t = productTranslations[language];
  const { selectedStoreId, selectedOwnerId } = useVendorStore();

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'food' | 'non-food'>('all');

  // Mock data - replace with API calls filtered by vendor ID
  const mockProducts: Product[] = [
    {
      id: '1',
      nameAr: 'تفاح أحمر',
      type: 'food',
      price: 2.99,
      quantity: 100,
      category: 'فواكه',
      vendorId: user?.id,
      expiryDate: '2024-03-20'
    },
    {
      id: '2',
      nameAr: 'عصير برتقال',
      type: 'food',
      price: 1.99,
      quantity: 50,
      category: 'مشروبات',
      vendorId: user?.id,
      expiryDate: '2024-03-15'
    }
  ];

  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.nameAr.includes(searchQuery);
    const matchesType = filterType === 'all' || product.type === filterType;
    const matchesStore = selectedStoreId === 'all' || product.storeId === selectedStoreId;
    const matchesOwner = selectedOwnerId === 'all' || product.ownerId === selectedOwnerId;
    return matchesSearch && matchesType && matchesStore && matchesOwner;
  });

  const expiredProducts = filteredProducts.filter(product => 
    product.type === 'food' &&
    product.expiryDate &&
    new Date(product.expiryDate) < new Date()
  );

  const handleAddEdit = (productData: Partial<Product>) => {
    // Here you would typically make an API call to save the product
    // Include the vendor ID with the product data
    const dataWithVendor = {
      ...productData,
      vendorId: user?.id,
      storeId: selectedStoreId === 'all' ? null : selectedStoreId,
      ownerId: selectedOwnerId === 'all' ? null : selectedOwnerId
    };
    console.log('Saving product:', dataWithVendor);
    setShowForm(false);
    setEditingProduct(null);
  };

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.products}</h1>
        <button
          onClick={() => {
            setEditingProduct(null);
            setShowForm(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center"
        >
          <Plus className="w-5 h-5 ml-2" />
          {t.addProduct}
        </button>
      </div>

      {expiredProducts.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {t.expiredProductsWarning.replace('{count}', expiredProducts.length.toString())}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <ProductFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filterType={filterType}
            onFilterChange={(type) => setFilterType(type)}
          />
        </div>
      </div>

      <ProductGrid
        products={filteredProducts}
        onEdit={(product) => {
          setEditingProduct(product);
          setShowForm(true);
        }}
      />

      <ProductFormModal
        show={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingProduct(null);
        }}
        onSubmit={handleAddEdit}
        editingProduct={editingProduct}
      />
    </div>
  );
}