import React from 'react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { X } from 'lucide-react';

interface Transaction {
  transaction_id: string;
  transaction_date: string;
  transaction_type: string;
  amount: number;
  product_name?: string;
  notes?: string;
  product_quantity?: number;
  unit_price?: number;
  total_price?: number;
}

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  vendorName: string;
  branchName: string;
}

const transactionTypeTranslations: Record<string, { ar: string; en: string }> = {
  'product_sale': { ar: 'بيع منتج', en: 'product_sale' },
  'tax': { ar: 'ضريبة', en: 'tax' },
  'expense': { ar: 'مصروف', en: 'expense' },
  'Bulk sale through POS - Products': { ar: 'بيع بالجملة عبر نقطة البيع - المنتجات', en: 'Bulk sale through POS - Products' },
  'Bulk sale through POS': { ar: 'بيع بالجملة عبر نقطة البيع', en: 'Bulk sale through POS' },
  'Products': { ar: 'المنتجات', en: 'Products' },
  'Monthly tax payment for': { ar: 'دفع الضريبة الشهرية لـ', en: 'Monthly tax payment for' }
};

export function TransactionHistoryModal({
  isOpen,
  onClose,
  transactions,
  vendorName,
  branchName
}: TransactionHistoryModalProps) {
  const { language } = useLanguageStore();
  const dir = language === 'ar' ? 'rtl' : 'ltr';

  const getTranslatedType = (type: string) => {
    const translation = transactionTypeTranslations[type];
    if (translation) {
      return language === 'ar' ? translation.ar : translation.en;
    }
    return type;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="bg-white rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[90vh] flex flex-col"
        dir={dir}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">
            {language === 'ar' 
              ? `سجل معاملات ${vendorName} - ${branchName}`
              : `Transaction History for ${vendorName} - ${branchName}`}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-auto flex-1 p-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'التاريخ' : 'Date'}
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'نوع المعاملة' : 'Type'}
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'المنتج' : 'Product'}
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'الكمية' : 'Quantity'}
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'السعر' : 'Price'}
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'المبلغ' : 'Amount'}
                </th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {language === 'ar' ? 'ملاحظات' : 'Notes'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.transaction_id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {new Date(transaction.transaction_date).toLocaleDateString(language === 'ar' ? 'ar-OM' : 'en-US')}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {getTranslatedType(transaction.transaction_type)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {transaction.product_name || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    {transaction.product_quantity || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                    {transaction.unit_price 
                      ? `${transaction.unit_price.toFixed(3)} OMR`
                      : '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                    {`${transaction.amount.toFixed(3)} OMR`}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {transaction.notes || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
