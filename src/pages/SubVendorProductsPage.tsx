import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Package, AlertTriangle } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { useAuthStore } from '../store/useAuthStore';
import { ProposedBusinessFilter } from '../components/vendor/ProposedBusinessFilter';
import { productTranslations } from '../translations/products';
import { VendorProductForm } from '../components/vendor/VendorProductForm';
import { getVendorAssignmentsByVendor } from '../services/vendorService';
import { getVendorProducts, createProduct, updateProduct, deleteProduct } from '../services/productService';
import type { Product } from '../types/product';
import type { VendorAssignment } from '../types/vendor';

export function SubVendorProductsPage() {
  const { language } = useLanguageStore();
  const { user } = useAuthStore();
  const t = productTranslations[language];
  
  const [assignments, setAssignments] = useState<VendorAssignment[]>([]);
  const [selectedBusinessCode, setSelectedBusinessCode] = useState<string | 'all'>('all');
  const [selectedBranch, setSelectedBranch] = useState<string | 'all'>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'food' | 'non-food'>('all');
  const [error, setError] = useState<string | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (user?.businessCode) {
      loadAssignments();
    }
  }, [user?.businessCode]);

  useEffect(() => {
    if (user?.businessCode) {
      // Reset branch selection when switching to "all" businesses
      if (selectedBusinessCode === 'all') {
        setSelectedBranch('all');
      }
      // Clear error when business is selected
      if (selectedBusinessCode !== 'all') {
        setError(null);
      }
      loadProducts();
    }
  }, [selectedBusinessCode, selectedBranch, user?.businessCode]);

  const loadAssignments = async () => {
    try {
      setIsLoading(true);
      const data = await getVendorAssignmentsByVendor(user!.businessCode);
      setAssignments(data);
    } catch (error) {
      console.error('Error loading assignments:', error);
      setError(t.errorLoadingAssignments);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProducts = async () => {
    if (!user?.businessCode) return;

    try {
      setIsLoading(true);
      console.log('Loading products with params:', {
        businessCode: selectedBusinessCode,
        vendorBusinessCode: user.businessCode,
        branchName: selectedBranch,
        isViewingAll: selectedBusinessCode === 'all'
      });
      
      const data = await getVendorProducts({
        businessCode: selectedBusinessCode === 'all' ? undefined : selectedBusinessCode,
        vendorBusinessCode: user.businessCode,
        branchName: selectedBranch === 'all' ? undefined : selectedBranch
      });
      
      console.log('Loaded products:', data);
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      setError(t.errorLoadingProducts);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (productData: Partial<Product>) => {
    if (!selectedBusinessCode) return;

    try {
      const data = {
        ...productData,
        business_code_of_owner: selectedBusinessCode,
        business_code_if_vendor: user!.businessCode,
        current_page: 'upcoming_products',
        accepted: false
      };

      if (editingProduct) {
        await updateProduct(editingProduct.product_id, data);
      } else {
        await createProduct(data);
      }

      await loadProducts();
      setShowForm(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error saving product:', error);
      setError(t.errorSavingProduct);
    }
  };

  const handleDelete = async (product: Product) => {
    try {
      await deleteProduct(product.product_id);
      await loadProducts();
      setDeletingProduct(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      setError(t.errorDeletingProduct);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.product_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || product.type === filterType;
    return matchesSearch && matchesType;
  });

  // Get available branches for selected business
  const availableBranches = useMemo(() => {
    if (selectedBusinessCode === 'all') return [];
    
    const branches = assignments
      .filter(a => a.owner_business_code === selectedBusinessCode)
      .map(a => a.branch_name)
      .filter((branch): branch is string => Boolean(branch));

    console.log('Available branches for business', selectedBusinessCode, ':', branches);
    return branches;
  }, [assignments, selectedBusinessCode]);

  console.log('Available branches:', availableBranches); // Debug log

  if (isLoading && assignments.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">{t.loading}</p>
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <Package className="w-16 h-16 text-gray-400" />
        <p className="text-gray-500">{t.noAssignments}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.products}</h1>
        
        <div className="flex items-center space-x-4 space-x-reverse w-full max-w-xl">
          <div className="flex-1 space-y-2">
            <ProposedBusinessFilter
              selectedBusinessCode={selectedBusinessCode}
              onBusinessChange={setSelectedBusinessCode}
              assignments={assignments}
              className="w-full"
            />
            {/* Branch Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.branch}
              </label>
              <select
                value={selectedBranch}
                onChange={(e) => {
                  console.log('Selected branch:', e.target.value);
                  setSelectedBranch(e.target.value);
                }}
                className={`w-full border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                  selectedBusinessCode === 'all' ? 'opacity-50' : ''
                }`}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
                disabled={selectedBusinessCode === 'all'}
              >
                <option value="all">{selectedBusinessCode === 'all' ? t.allBranches : t.selectBranch}</option>
                {availableBranches.map(branch => (
                  <option key={branch} value={branch}>
                    {branch || 'Unnamed Branch'}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={() => {
              if (selectedBusinessCode === 'all') {
                setError(t.selectBusinessFirst);
                return;
              }
              setError(null); // Clear error when proceeding to add product
              setEditingProduct(null);
              setShowForm(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center"
          >
            <Plus className="w-5 h-5 ml-2" />
            {t.addProduct}
          </button>
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
                placeholder={t.searchProduct}
                className="w-full pr-10 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as typeof filterType)}
              className="border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              <option value="all">{t.allProducts}</option>
              <option value="food">{t.foodProducts}</option>
              <option value="non-food">{t.nonFoodProducts}</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50">
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

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.product}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.business}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.branch}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.type}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.price}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.quantity}
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
                <tr key={product.product_id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.product_name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-500" />
                          </div>
                        )}
                      </div>
                      <div className="mr-4">
                        <div className="text-sm font-medium text-gray-900">
                          {product.product_name}
                        </div>
                        {product.description && (
                          <div className="text-sm text-gray-500">
                            {product.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {assignments.find(a => a.owner_business_code === product.business_code_of_owner)?.owner_business_name || t.unknownBusiness}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {product.branch_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      product.type === 'food' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {product.type === 'food' ? t.food : t.nonFood}
                    </span>
                    {product.type === 'food' && product.expiry_date && (
                      <div className="mt-1 text-xs">
                        <span className="text-gray-500">{t.expiryDate}:</span>
                        <span className={`mr-1 ${
                          new Date(product.expiry_date) < new Date() 
                            ? 'text-red-600 font-medium' 
                            : 'text-gray-900'
                        }`}>
                          {new Date(product.expiry_date).toLocaleDateString(
                            language === 'ar' ? 'ar' : 'en-US',
                            { dateStyle: 'medium' }
                          )}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.price.toFixed(3)} {t.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.quantity}
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
                    {product.rejection_reason && (
                      <p className="text-xs text-red-600 mt-1">
                        {product.rejection_reason}
                      </p>
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
                    <button
                      onClick={() => setDeletingProduct(product)}
                      className="text-red-600 hover:text-red-900"
                    >
                      {t.delete}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingProduct ? t.editProduct : t.addProduct}
            </h2>
            <VendorProductForm
              onSubmit={handleSubmit}
              initialData={editingProduct || undefined}
              ownerBusinessCode={selectedBusinessCode}
              assignments={assignments}
              onCancel={() => {
                setShowForm(false);
                setEditingProduct(null);
              }}
            />
          </div>
        </div>
      )}

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