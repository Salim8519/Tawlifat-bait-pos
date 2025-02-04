import React, { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle, Package } from 'lucide-react';
import { ProductForm } from '../components/products/ProductForm';
import { BranchSelector } from '../components/products/BranchSelector';
import { BarcodeButton } from '../components/products/BarcodeButton';
import { useLanguageStore } from '../store/useLanguageStore'; 
import { useAuthStore } from '../store/useAuthStore';
import { useBusinessStore } from '../store/useBusinessStore'; 
import { useSettingsStore } from '../store/useSettingsStore';
import { getBranchesByBusinessCode } from '../services/businessService';
import { getUserMainBranch } from '../services/profileService';
import { getProfile } from '../services/profileService';
import { ArrowUpDown } from 'lucide-react';
import { BranchFilter } from '../components/products/BranchFilter'; 
import { productTranslations } from '../translations/products';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/productService';
import type { Product, ProductFilter } from '../types/product'; 

type SortField = 'product_name' | 'business_name_of_product' | 'type' | 'price' | 'quantity' | 'expiry_date' | 'branch_name';
type SortDirection = 'asc' | 'desc';

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
  const { user } = useAuthStore();
  const { branches, setBranches } = useBusinessStore();
  const { settings } = useSettingsStore();
  const { getCurrentBranch } = useBusinessStore();
  const t = productTranslations[language];

  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string | 'all'>('all');
  const [filterType, setFilterType] = useState<'all' | 'food' | 'non-food'>('all');
  const [mainBranch, setMainBranch] = useState<string | null>(null);
  const [shouldSetMainBranch, setShouldSetMainBranch] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [sortField, setSortField] = useState<SortField>('product_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [isInitialized, setIsInitialized] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [showLowQuantity, setShowLowQuantity] = useState(false);
  const [lowQuantityThreshold] = useState(10); // Can be made configurable via settings if needed

  useEffect(() => {
    const loadProfile = async () => {
      if (user?.id) {
        const profile = await getProfile(user.id);
        setUserProfile(profile);
      }
    };
    loadProfile();
  }, [user?.id]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedProducts = React.useMemo(() => {
    return [...products].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'product_name':
          comparison = a.product_name.localeCompare(b.product_name);
          break;
        case 'business_name_of_product':
          comparison = (a.business_name_of_product || '').localeCompare(b.business_name_of_product || '');
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'quantity':
          comparison = a.quantity - b.quantity;
          break;
        case 'expiry_date':
          if (!a.expiry_date && !b.expiry_date) comparison = 0;
          else if (!a.expiry_date) comparison = 1;
          else if (!b.expiry_date) comparison = -1;
          else comparison = new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
          break;
        case 'branch_name':
          comparison = (a.branch_name || '').localeCompare(b.branch_name || '');
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [products, sortField, sortDirection]);

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

  useEffect(() => {
    if (isInitialized) {
      if (user?.businessCode) {
        loadProducts();
      }
    }
  }, [searchQuery, filterType, selectedBranch, isInitialized, user?.businessCode]);
  
  useEffect(() => {
    const loadBranches = async () => {
      if (user?.businessCode) {
        try {
          setIsLoading(true);
          const branchData = await getBranchesByBusinessCode(user.businessCode);
          setBranches(branchData);

          // Get user's main branch
          const mainBranch = await getUserMainBranch(user.id);

          if (mainBranch) {
            console.log('Setting main branch:', mainBranch);
            setMainBranch(mainBranch);
            if (shouldSetMainBranch && user?.role === 'cashier') {
              setSelectedBranch(mainBranch);
              setShouldSetMainBranch(false);
            }
          }
          setIsInitialized(true);
        } catch (error) {
          console.error('Error loading branches:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    loadBranches();
  }, [user?.businessCode, setBranches]);

  const loadProducts = async () => {
    if (!user?.businessCode) {
      console.error('No business code available');
      // setError(t.noBusinessCode);
      return;
    }

    try {
      setIsLoading(true);
      console.log('Loading products for business:', user.businessCode); // Debug log
      
      const data = await getProducts({
        businessCode: user.businessCode, // ALWAYS include business code
        branchName: selectedBranch === 'all' ? undefined : selectedBranch,
        page: 'products',
        type: filterType === 'all' ? undefined : filterType,
        accepted: true // Only show accepted products
      });
      
      console.log(`Loaded ${data.length} products`); // Debug log
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      // setError(t.errorLoadingProducts);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEdit = async (productData: Partial<Product>) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.product_id, productData);
      } else {
        await createProduct({
          ...productData as Omit<Product, 'product_id' | 'date_of_creation'>,
          business_code_of_owner: user?.businessCode || '',
          current_page: 'products',
          accepted: true
        });
      }
      await loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
    }
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleDelete = async (product: Product) => {
    try {
      const success = await deleteProduct(product.product_id);
      if (success) {
        await loadProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
    setDeletingProduct(null);
  };

  const handleBranchChange = (branchId: string | 'all') => {
    console.log('Branch change requested:', branchId);
    setShouldSetMainBranch(false); // Disable auto-setting main branch when user manually changes
    setSelectedBranch(branchId);
  };

  const expiredProducts = products.filter(product => 
    product.type === 'food' &&
    product.expiry_date &&
    new Date(product.expiry_date) < new Date()
  );

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
            <BranchSelector
              branches={branches}
              selectedBranch={selectedBranch}
              onBranchChange={handleBranchChange}
              mainBranch={mainBranch}
            />
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
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="lowQuantity"
                  checked={showLowQuantity}
                  onChange={(e) => setShowLowQuantity(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="lowQuantity" className="text-sm text-gray-700">
                  {language === 'ar' ? 'المنتجات منخفضة الكمية' : 'Low Quantity Products'}
                </label>
              </div>
            </div>
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
                  <SortableHeader field="product_name">
                    {t.productName}
                  </SortableHeader>
                  <SortableHeader field="business_name_of_product">
                    {t.vendor}
                  </SortableHeader>
                  <SortableHeader field="type">
                    {t.productType}
                  </SortableHeader>
                  <SortableHeader field="price">
                    {t.price}
                  </SortableHeader>
                  <SortableHeader field="quantity">
                    {t.quantity}
                  </SortableHeader>
                  <SortableHeader field="expiry_date">
                    {t.expiryDate}
                  </SortableHeader>
                  <SortableHeader field="branch_name">
                    {language === 'ar' ? 'الفرع' : 'Branch'}
                  </SortableHeader>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">{t.actions}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedProducts
                  .filter(product => {
                    if (showLowQuantity) {
                      return product.quantity <= lowQuantityThreshold;
                    }
                    return true;
                  })
                  .map((product) => {
                    const isExpired = product.type === 'food' && 
                      product.expiry_date && 
                      new Date(product.expiry_date) < new Date();
                    
                    return (
                      <tr key={product.product_id} className={isExpired ? 'bg-red-50' : undefined}>
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
                              {product.business_code_if_vendor && settings?.vendor_commission_enabled && (
                                <div className="text-xs text-gray-500">
                                  {t.originalPrice}: {product.price.toFixed(3)} {t.currency}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <span className={`inline-flex items-center text-sm font-medium ${
                              product.business_code_if_vendor ? 
                              'px-2.5 py-0.5 rounded-full text-xs ' + getVendorColor(product.business_name_of_product || '') : 
                              'text-gray-900'
                            }`}>
                              {product.business_name_of_product || t.unknownBusiness}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            product.type === 'food' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {product.type === 'food' ? t.food : t.nonFood}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {getDisplayPrice(product)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`${
                            product.quantity <= lowQuantityThreshold ? 'text-red-600 font-medium' : ''
                          }`}>
                            {product.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.type === 'food' && product.expiry_date ? (
                            <div className={`text-sm ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                              {new Date(product.expiry_date).toLocaleDateString(
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          {product.branch_name || (language === 'ar' ? 'الرئيسي' : 'Main')}
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
                          <button
                            onClick={() => setDeletingProduct(product)}
                            className="text-red-600 hover:text-red-900 ml-4"
                          >
                            {t.delete}
                          </button>
                          <BarcodeButton 
                            product={product} 
                            className="ml-2"
                            userProfile={userProfile}
                          />
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">{t.confirmDelete}</h2>
            <p className="text-gray-600 mb-6">
              {t.deleteConfirmationMessage.replace('{name}', deletingProduct.product_name)}
            </p>
            
            <div className="flex justify-end space-x-2 space-x-reverse">
              <button
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => handleDelete(deletingProduct)}
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