import React, { useState } from 'react';
import { Search, Package, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { BarcodeButton } from '../components/products/BarcodeButton';
import { upcomingProductsTranslations } from '../translations/upcomingProducts';
import { BranchFilter } from '../components/branch/BranchFilter';

interface UpcomingProduct {
  id: string;
  vendorId: string;
  vendorName: string;
  productName: string;
  category: string;
  quantity: number;
  price: number;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

// Mock data - replace with API calls
const mockProducts: UpcomingProduct[] = [
  {
    id: '1',
    barcode: '741852963357',
    vendorId: '1',
    vendorName: 'علي سالم',
    productName: 'تفاح أحمر',
    category: 'فواكه',
    quantity: 50,
    price: 2.99,
    submittedAt: '2024-03-15T10:30:00',
    status: 'pending'
  },
  {
    id: '2',
    barcode: '963741852159',
    vendorId: '2',
    vendorName: 'محمد خالد',
    productName: 'عصير برتقال',
    category: 'مشروبات',
    quantity: 30,
    price: 1.99,
    submittedAt: '2024-03-14T15:45:00',
    status: 'approved',
    notes: 'تم التأكيد على السعر والكمية'
  }
];

export function UpcomingProductsPage() {
  const { language } = useLanguageStore();
  const t = upcomingProductsTranslations[language];
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedProduct, setSelectedProduct] = useState<UpcomingProduct | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const handleApprove = (product: UpcomingProduct) => {
    // Here you would make an API call to approve the product
    console.log('Approving product:', product.id, 'Notes:', reviewNotes);
    setSelectedProduct(null);
    setReviewNotes('');
  };

  const handleReject = (product: UpcomingProduct) => {
    // Here you would make an API call to reject the product
    console.log('Rejecting product:', product.id, 'Notes:', reviewNotes);
    setSelectedProduct(null);
    setReviewNotes('');
  };

  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = 
      product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || product.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = filteredProducts.filter(p => p.status === 'pending').length;

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.upcomingProducts}</h1>
        {pendingCount > 0 && (
          <div className="flex items-center text-yellow-600">
            <AlertTriangle className="w-5 h-5 ml-2" />
            <span>{t.pendingReviewCount.replace('{count}', pendingCount.toString())}</span>
          </div>
        )}
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
                placeholder={t.searchProducts}
                className="w-full pr-10 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              <option value="all">{t.allStatuses}</option>
              <option value="pending">{t.pending}</option>
              <option value="approved">{t.approved}</option>
              <option value="rejected">{t.rejected}</option>
            </select>
            <BranchFilter />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.product}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.vendor}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.category}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.quantity}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.price}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.submittedAt}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.status}
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">{t.actions}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-500" />
                        </div>
                      </div>
                      <div className="mr-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.productName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.vendorName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.price.toFixed(3)} {t.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(product.submittedAt).toLocaleDateString(
                      language === 'ar' ? 'ar' : 'en-US',
                      { dateStyle: 'medium' }
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.status === 'approved' ? 'bg-green-100 text-green-800' :
                      product.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {t[product.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {product.status === 'pending' && (
                      <>
                        <button
                          onClick={() => setSelectedProduct(product)}
                          className="text-indigo-600 hover:text-indigo-900 ml-4"
                        >
                          {t.review}
                        </button>
                        <BarcodeButton product={product} />
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-semibold mb-4">{t.reviewProduct}</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t.product}
                  </label>
                  <p className="mt-1">{selectedProduct.productName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t.vendor}
                  </label>
                  <p className="mt-1">{selectedProduct.vendorName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t.quantity}
                  </label>
                  <p className="mt-1">{selectedProduct.quantity}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t.price}
                  </label>
                  <p className="mt-1">{selectedProduct.price.toFixed(3)} {t.currency}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.reviewNotes}
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>

              <div className="flex justify-end space-x-2 space-x-reverse">
                <button
                  onClick={() => {
                    setSelectedProduct(null);
                    setReviewNotes('');
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={() => handleReject(selectedProduct)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  {t.reject}
                </button>
                <button
                  onClick={() => handleApprove(selectedProduct)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  {t.approve}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}