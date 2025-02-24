import React, { useState, useEffect } from 'react';
import { Search, Package, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { useAuthStore } from '../store/useAuthStore';
import { useBusinessStore } from '../store/useBusinessStore'; 
import { useSettingsStore } from '../store/useSettingsStore';
import { getBranchesByBusinessCode } from '../services/businessService';
import { BranchFilter } from '../components/products/BranchFilter';
import { BarcodeButton } from '../components/products/BarcodeButton';
import { upcomingProductsTranslations } from '../translations/upcomingProducts';
import { getProducts, approveProduct, deleteProduct } from '../services/productService';
import type { Product, ProductFilter } from '../types/product';
import { getProfile } from '../services/profileService';
import type { Profile } from '../types/profile';
import { startProductMonitoring } from '../services/productMonitorService';

// Color palette for vendor badges
const VENDOR_COLORS = [
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-purple-100 text-purple-800',
  'bg-pink-100 text-pink-800',
  'bg-yellow-100 text-yellow-800',
  'bg-indigo-100 text-indigo-800',
  'bg-red-100 text-red-800',
  'bg-teal-100 text-teal-800',
];

// Function to get consistent color for vendor name
const getVendorColor = (vendorName: string): string => {
  let hash = 0;
  for (let i = 0; i < vendorName.length; i++) {
    hash = vendorName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % VENDOR_COLORS.length;
  return VENDOR_COLORS[index];
};

export function UpcomingProductsPage() {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const { branches, setBranches } = useBusinessStore();
  const { settings } = useSettingsStore();
  const { getCurrentBranch } = useBusinessStore();
  const t = upcomingProductsTranslations[language];
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<string | 'all'>('all');
  const isCashier = user?.role === 'cashier';
  const currentBranch = getCurrentBranch();
  const [userProfile, setUserProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (user?.id) {
        const profile = await getProfile(user.id);
        setUserProfile(profile);
      }
    };
    loadProfile();
  }, [user?.id]);

  useEffect(() => {
    if (user?.businessCode) {
      // Reset monitoring state when page is visited
      startProductMonitoring(
        user.businessCode,
        isCashier ? currentBranch?.branch_name : selectedBranch === 'all' ? undefined : selectedBranch,
        language
      );
    }
  }, [user?.businessCode, selectedBranch, language]);

  const calculatePriceWithCommission = (product: Product): number => {
    // Only apply commission to vendor products if enabled in settings
    if (!settings || !settings.vendor_commission_enabled || !product.business_code_if_vendor) {
      return product.price;
    }

    // Check if the price meets minimum commission amount
    if (product.price < (settings.minimum_commission_amount || 0)) {
      return product.price;
    }

    // Calculate commission
    const commission = (product.price * settings.default_commission_rate) / 100;
    return product.price + commission;
  };

  const getDisplayPrice = (product: Product) => {
    // Always show calculated price
    const finalPrice = calculatePriceWithCommission(product);
    return <span>{finalPrice.toFixed(3)} {t.currency}</span>;
  };

  useEffect(() => {
    // For cashiers, always use their assigned branch
    if (isCashier && currentBranch) {
      setSelectedBranch(currentBranch.branch_name);
    }
  }, [isCashier, currentBranch]);

  useEffect(() => {
    if (user?.businessCode) {
      loadProducts();
    }
  }, [searchQuery, statusFilter, selectedBranch]);
  
  // Add new useEffect to refresh branches
  useEffect(() => {
    const loadBranches = async () => {
      if (user?.businessCode) {
        try {
          const branchData = await getBranchesByBusinessCode(user.businessCode);
          setBranches(branchData);
        } catch (error) {
          console.error('Error loading branches:', error);
        }
      }
    };
    
    loadBranches();
  }, [user?.businessCode, setBranches]);

  const loadProducts = async () => {
    if (!user?.businessCode) {
      console.error('No business code available');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Loading upcoming products for business:', user.businessCode); // Debug log
      
      const filters: ProductFilter = {
        businessCode: user.businessCode,
        branchName: isCashier ? currentBranch?.branch_name : selectedBranch === 'all' ? undefined : selectedBranch,
        page: 'upcoming_products',
        searchQuery: searchQuery || undefined,
        accepted: statusFilter === 'approved' ? true : 
                 statusFilter === 'rejected' ? false :
                 statusFilter === 'pending' ? false :
                 undefined
      };

      console.log('Fetching products with filters:', filters);
      const data = await getProducts(filters);
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (product: Product) => {
    try {
      await approveProduct(product.product_id, true);
      await loadProducts();
      setSelectedProduct(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Error approving product:', error);
    }
  };

  const handleReject = async (product: Product) => {
    if (!reviewNotes.trim()) {
      alert(t.rejectionReasonRequired);
      return;
    }
    try {
      await approveProduct(product.product_id, false, reviewNotes);
      await loadProducts();
      setSelectedProduct(null);
      setReviewNotes('');
    } catch (error) {
      console.error('Error rejecting product:', error);
    }
  };

  const handleDelete = async (productId: number) => {
    if (confirm(t.confirmDelete)) {
      try {
        await deleteProduct(productId);
        await loadProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const pendingCount = products.filter(p => !p.accepted && !p.rejection_reason).length;

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            {!isCashier && (
              <BranchFilter
                branches={branches}
                selectedBranch={selectedBranch}
                onBranchChange={setSelectedBranch}
              />
            )}
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
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">{t.loading}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">{t.noProducts}</p>
            </div>
          ) : (
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
                    {t.productionDate}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.expiryDate}
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
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'الفرع' : 'Branch'}
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">{t.actions}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.product_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            {product.image_url ? (
                              <img 
                                src={product.image_url} 
                                alt={product.product_name}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <Package className="h-6 w-6 text-gray-500" />
                            )}
                          </div>
                        </div>
                        <div className="mr-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.product_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.type === 'food' ? t.food : t.nonFood}
                          </div>
                      </div>
                    </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`${
                        product.business_code_if_vendor ? 
                        'px-2.5 py-0.5 rounded-full text-xs ' + getVendorColor(product.business_name_of_product || '') : 
                        'text-gray-900'
                      }`}>
                        {product.business_name_of_product || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {product.type === 'food' ? t.food : t.nonFood}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.production_date ? (
                        <div className="text-sm text-gray-900">
                          {new Date(product.production_date).toLocaleDateString(
                            language === 'ar' ? 'ar' : 'en-US',
                            { dateStyle: 'medium' }
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.type === 'food' && product.expiry_date ? (
                        <div className={`text-sm ${
                          new Date(product.expiry_date) < new Date() 
                            ? 'text-red-600 font-medium' 
                            : 'text-gray-900'
                        }`}>
                          {new Date(product.expiry_date).toLocaleDateString(
                            language === 'ar' ? 'ar' : 'en-US',
                            { dateStyle: 'medium' }
                          )}
                          {new Date(product.expiry_date) < new Date() && (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getDisplayPrice(product)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(
                        product.date_of_creation
                      ).toLocaleDateString(
                        language === 'ar' ? 'ar' : 'en-US',
                        { dateStyle: 'medium' }
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.accepted ? 'bg-green-100 text-green-800' :
                        product.rejection_reason ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {product.accepted ? t.approved :
                         product.rejection_reason ? t.rejected :
                         t.pending}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.branch_name || (language === 'ar' ? 'الرئيسي' : 'Main')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {!product.accepted && !product.rejection_reason && (
                        <>
                          <button
                            onClick={() => setSelectedProduct(product)}
                            className="text-indigo-600 hover:text-indigo-900 ml-4"
                          >
                            {t.review}
                          </button>
                          <BarcodeButton 
                            product={product} 
                            className="ml-2"
                            userProfile={userProfile}
                          />
                        </>
                      )}
                      {product.rejection_reason && (
                        <button
                          onClick={() => handleDelete(product.product_id)}
                          className="text-red-600 hover:text-red-900 ml-4"
                        >
                          {t.delete}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
                  <p className="mt-1">{selectedProduct.product_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t.vendor}
                  </label>
                  <p className="mt-1">{selectedProduct.business_name_of_product || '-'}</p>
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
                  <p className="mt-1">{getDisplayPrice(selectedProduct)}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t.description}
                </label>
                <p className="mt-1 text-sm text-gray-600 bg-gray-50 p-3 rounded-md min-h-[4rem]">
                  {selectedProduct.description || '-'}
                </p>
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