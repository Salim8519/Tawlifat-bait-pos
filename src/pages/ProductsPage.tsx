import React, { useState } from 'react';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import { ProductForm } from '../components/products/ProductForm';
import { BarcodeButton } from '../components/products/BarcodeButton';
import { useLanguageStore } from '../store/useLanguageStore'; 
import { productTranslations } from '../translations/products'; 
import type { Product } from '../types/pos'; 

interface ProductLabel {
  id: string;
  name: string;
  color: string;
}

// Mock labels - replace with API data
const productLabels: ProductLabel[] = [
  { id: '1', name: 'جديد', color: 'bg-green-100 text-green-800' },
  { id: '2', name: 'عرض خاص', color: 'bg-blue-100 text-blue-800' },
  { id: '3', name: 'نفذت الكمية', color: 'bg-red-100 text-red-800' },
  { id: '4', name: 'موسمي', color: 'bg-yellow-100 text-yellow-800' }
];

export function ProductsPage() {
  const { language } = useLanguageStore();
  const t = productTranslations[language];

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'food' | 'non-food'>('all');

  const handleAddEdit = (productData: Partial<Product>) => {
    console.log('Saving product:', productData);
    setShowForm(false);
    setEditingProduct(null);
  };

  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.nameAr.includes(searchQuery) ||
                         product.barcode?.includes(searchQuery);
    const matchesType = filterType === 'all' || product.type === filterType;
    return matchesSearch && matchesType;
  });

  const expiredProducts = filteredProducts.filter(product => 
    product.type === 'food' &&
    product.expiryDate &&
    new Date(product.expiryDate) < new Date()
  );

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
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

      {/* Expired Products Warning */}
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

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchProduct}
                className="w-full pr-10 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value as typeof filterType)
              }}
              className="border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              <option value="all">{t.allProducts}</option>
              <option value="food">{t.foodProducts}</option>
              <option value="non-food">{t.nonFoodProducts}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingProduct ? t.updateProduct : t.addNewProduct}
            </h2>
            <ProductForm
              onSubmit={handleAddEdit}
              initialData={editingProduct || undefined}
            />
            <button
              onClick={() => {
                setShowForm(false);
                setEditingProduct(null);
              }}
              className="mt-4 px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.productName}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.vendor}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.productType}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.price}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.quantity}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.expiryDate}
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">{t.actions}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const isExpired = product.type === 'food' && 
                  product.expiryDate && 
                  new Date(product.expiryDate) < new Date();
                
                return (
                  <tr key={product.id} className={isExpired ? 'bg-red-50' : undefined}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{product.nameAr}</div>
                      {product.barcode && (
                        <div className="text-sm text-gray-500">{product.barcode}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.vendorName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.type === 'food' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.type === 'food' ? t.food : t.nonFood}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.price.toFixed(3)} {t.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.type === 'food' && product.expiryDate ? (
                        <div className={`text-sm ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                          {new Date(product.expiryDate).toLocaleDateString(
                            language === 'ar' ? 'ar' : 'en-US',
                            { dateStyle: 'medium' }
                          )}
                          {isExpired && (
                            <div className="flex items-center text-red-600 text-xs mt-1">
                              <AlertTriangle className="w-4 h-4 ml-1" />
                              {t.expired}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setEditingProduct(product);
                          setShowForm(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 ml-4"
                      >
                        {t.edit}
                      </button>
                      <BarcodeButton product={product} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Mock data - replace with actual API calls
const mockProducts: Product[] = [
  {
    id: '1',
    barcode: '478912365412',
    nameAr: 'تفاح أحمر',
    vendorId: '1',
    vendorName: 'علي سالم',
    type: 'food',
    price: 2.99,
    quantity: 100,
    category: 'فواكه',
    expiryDate: '2024-03-20T00:00:00',
    preparationDate: '2024-03-01T00:00:00'
  },
  {
    id: '2',
    barcode: '789456123741',
    nameAr: 'عصير برتقال',
    vendorId: '2',
    vendorName: 'محمد خالد',
    type: 'food',
    price: 1.99,
    quantity: 50,
    category: 'مشروبات',
    expiryDate: '2024-03-15T00:00:00',
    preparationDate: '2024-03-01T00:00:00'
  },
  {
    id: '3',
    barcode: '852963741159',
    nameAr: 'منظف متعدد الأغراض',
    vendorId: '3',
    vendorName: 'سعيد عبدالله',
    type: 'non-food',
    price: 4.99,
    quantity: 30,
    category: 'منظفات'
  }
];