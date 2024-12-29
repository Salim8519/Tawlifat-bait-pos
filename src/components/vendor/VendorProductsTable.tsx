import React from 'react';
import { Package } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { vendorDashboardTranslations } from '../../translations/vendorDashboard';
import { useVendorStore } from '../../store/useVendorStore';

interface VendorProduct {
  id: string;
  name: string;
  storeId: string;
  storeName: string;
  branch: string;
  price: number;
  quantity: number;
  status: 'active' | 'inactive' | 'out_of_stock';
}

// Mock data - replace with API calls
const mockProducts: VendorProduct[] = [
  {
    id: '1',
    name: 'تفاح أحمر',
    storeId: '1',
    storeName: 'سوبرماركت السعادة',
    branch: 'الفرع الرئيسي',
    price: 2.99,
    quantity: 100,
    status: 'active'
  },
  {
    id: '2',
    name: 'عصير برتقال',
    storeId: '2',
    storeName: 'سوبرماركت السعادة',
    branch: 'فرع صلالة',
    price: 1.99,
    quantity: 0,
    status: 'out_of_stock'
  }
];

export function VendorProductsTable() {
  const { language } = useLanguageStore();
  const t = vendorDashboardTranslations[language];
  const { selectedStoreId } = useVendorStore();

  const filteredProducts = selectedStoreId === 'all'
    ? mockProducts
    : mockProducts.filter(product => product.storeId === selectedStoreId);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">{t.products}</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.productName}
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.store}
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t.branch}
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
                <span className="sr-only">{t.edit}</span>
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
                        {product.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.storeName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.branch}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.price.toFixed(3)} {t.currency}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {product.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    product.status === 'active' ? 'bg-green-100 text-green-800' :
                    product.status === 'out_of_stock' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {product.status === 'active' ? t.active :
                     product.status === 'out_of_stock' ? t.outOfStock :
                     t.inactive}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-indigo-600 hover:text-indigo-900">
                    {t.edit}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}