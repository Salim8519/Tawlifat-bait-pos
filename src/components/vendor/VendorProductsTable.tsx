import React, { useState } from 'react';
import { Package, ArrowUpDown } from 'lucide-react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { vendorDashboardTranslations } from '../../translations/vendorDashboard';
import { useVendorStore } from '../../store/useVendorStore';

type SortField = 'product_name' | 'store' | 'branch' | 'price' | 'quantity' | 'type' | 'status' | 'production_date';
type SortDirection = 'asc' | 'desc';

interface VendorProduct {
  id: string;
  name: string;
  storeId: string;
  storeName: string;
  branch: string;
  price: number;
  quantity: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  type: 'food' | 'non-food';
  production_date?: string;
  accepted?: boolean;
  rejection_reason?: string;
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
    status: 'active',
    type: 'food',
    production_date: '2022-01-01',
    accepted: true,
  },
  {
    id: '2',
    name: 'عصير برتقال',
    storeId: '2',
    storeName: 'سوبرماركت السعادة',
    branch: 'فرع صلالة',
    price: 1.99,
    quantity: 0,
    status: 'out_of_stock',
    type: 'food',
    production_date: '2022-02-01',
    accepted: false,
    rejection_reason: 'Reason for rejection',
  }
];

export function VendorProductsTable() {
  const { language } = useLanguageStore();
  const t = vendorDashboardTranslations[language];
  const { selectedStoreId } = useVendorStore();
  const [sortField, setSortField] = useState<SortField>('product_name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedProducts = [...mockProducts]
    .filter(product => selectedStoreId === 'all' ? true : product.storeId === selectedStoreId)
    .sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      switch (sortField) {
        case 'product_name':
          return direction * a.name.localeCompare(b.name);
        case 'store':
          return direction * a.storeName.localeCompare(b.storeName);
        case 'branch':
          return direction * a.branch.localeCompare(b.branch);
        case 'price':
          return direction * (a.price - b.price);
        case 'quantity':
          return direction * (a.quantity - b.quantity);
        case 'type':
          return direction * a.type.localeCompare(b.type);
        case 'status':
          return direction * a.status.localeCompare(b.status);
        case 'production_date':
          if (!a.production_date) return direction;
          if (!b.production_date) return -direction;
          return direction * a.production_date.localeCompare(b.production_date);
        default:
          return 0;
      }
    });

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <th
      scope="col"
      className={`px-6 py-3 text-${language === 'ar' ? 'right' : 'left'} text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center justify-between">
        <span>{children}</span>
        <ArrowUpDown className={`h-4 w-4 ${sortField === field ? 'text-indigo-500' : 'text-gray-400'} group-hover:text-indigo-500`} />
      </div>
    </th>
  );

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">{t.products}</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader field="product_name">{t.productName}</SortableHeader>
              <SortableHeader field="store">{t.store}</SortableHeader>
              <SortableHeader field="branch">{t.branch}</SortableHeader>
              <SortableHeader field="type">{t.type}</SortableHeader>
              <SortableHeader field="price">{t.price}</SortableHeader>
              <SortableHeader field="quantity">{t.quantity}</SortableHeader>
              <SortableHeader field="status">{t.status}</SortableHeader>
              <SortableHeader field="production_date">{t.productionDate}</SortableHeader>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">{t.actions}</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedProducts.map((product) => (
              <tr key={product.id}>
                <td className={`px-6 py-4 whitespace-nowrap text-${language === 'ar' ? 'right' : 'left'}`}>
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-500" />
                      </div>
                    </div>
                    <div className={`${language === 'ar' ? 'mr-4' : 'ml-4'}`}>
                      <div className="text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-${language === 'ar' ? 'right' : 'left'}`}>
                  {product.storeName}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-${language === 'ar' ? 'right' : 'left'}`}>
                  {product.branch}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-${language === 'ar' ? 'right' : 'left'}`}>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    product.type === 'food' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {product.type === 'food' ? t.food : t.nonFood}
                  </span>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-${language === 'ar' ? 'right' : 'left'}`}>
                  {product.price.toFixed(3)} {t.currency}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-${language === 'ar' ? 'right' : 'left'}`}>
                  {product.quantity}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-${language === 'ar' ? 'right' : 'left'}`}>
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
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-${language === 'ar' ? 'right' : 'left'}`}>
                  {product.type === 'food' && product.production_date ? product.production_date : '-'}
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