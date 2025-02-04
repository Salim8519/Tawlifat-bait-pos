import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Calendar, X, Printer } from 'lucide-react';
import { useLanguageStore } from '../store/useLanguageStore';
import { useAuthStore } from '../store/useAuthStore';
import { receiptTranslations } from '../translations/receipts';
import { getReceiptsByBusiness, type Receipt, type PaymentMethod } from '../services/receiptService';
import { format } from 'date-fns';
import arSA from 'date-fns/locale/ar-SA';
import { usePrintReceipt } from '../hooks/usePrintReceipt';
import { useSettingsStore } from '../store/useSettingsStore';

export function ReceiptsHistoryPage() {
  const { language } = useLanguageStore();
  const { businessCode } = useAuthStore();
  const { settings } = useSettingsStore();
  const t = receiptTranslations[language];
  const { print, isPrinting, error: printError, selectedPrinterWidth, setSelectedPrinterWidth } = usePrintReceipt();

  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'sales' | 'returns'>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | 'all'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Filter states
  const [dateRange, setDateRange] = useState({
    from: format(new Date().setDate(new Date().getDate() - 7), 'yyyy-MM-dd'), // Last 7 days by default
    to: format(new Date(), 'yyyy-MM-dd')
  });
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [returnFilter, setReturnFilter] = useState<string>('all');

  // Load receipts with filters
  useEffect(() => {
    const loadReceipts = async () => {
      if (!businessCode) return;

      try {
        setLoading(true);
        setError(null);

        const filters = {
          startDate: dateRange.from,
          endDate: dateRange.to,
          paymentMethod: paymentFilter !== 'all' ? paymentFilter as PaymentMethod : undefined,
          isReturn: returnFilter !== 'all' ? returnFilter === 'return' : undefined
        };

        const data = await getReceiptsByBusiness(businessCode, filters);
        setReceipts(data);
      } catch (err) {
        console.error('Error loading receipts:', err);
        setError(t.errorLoadingReceipts);
      } finally {
        setLoading(false);
      }
    };

    loadReceipts();
  }, [businessCode, dateRange.from, dateRange.to, paymentFilter, returnFilter]);

  const filteredReceipts = receipts.filter((receipt) => {
    // Type filter
    if (selectedType === 'sales' && receipt.is_return) return false;
    if (selectedType === 'returns' && !receipt.is_return) return false;

    // Payment method filter
    if (selectedPaymentMethod !== 'all' && receipt.payment_method !== selectedPaymentMethod) return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        receipt.receipt_id.toLowerCase().includes(query) ||
        (receipt.customer_phone && receipt.customer_phone.toLowerCase().includes(query))
      );
    }

    return true;
  });

  const handleViewReceipt = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setShowModal(true);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    const csvContent = filteredReceipts.map(receipt => ({
      receipt_id: receipt.receipt_id,
      date: format(new Date(receipt.receipt_date), 'yyyy-MM-dd HH:mm:ss'),
      customer: receipt.customer_name || t.guestCustomer,
      phone: receipt.customer_phone || '-',
      total: receipt.total_amount,
      payment: receipt.payment_method,
      status: receipt.is_return ? t.returned : t.completed
    }));
    
    console.log('Exporting receipts:', csvContent);
  };

  const handlePrint = async (receipt: Receipt) => {
    try {
      // For now we're passing an empty cart items array since we don't have the items
      // You may want to fetch the cart items from the database if needed
      await print(receipt, []);
    } catch (err) {
      console.error('Error printing receipt:', err);
    }
  };

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{t.receiptsHistory}</h1>
        <button
          onClick={handleExport}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <Download className="w-5 h-5 ml-2" />
          {t.export}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchReceipt}
                className="w-full pr-10 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              />
            </div>

            <div className="flex space-x-2 space-x-reverse">
              <div className="relative flex-1">
                <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                  className="w-full pr-10 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="relative flex-1">
                <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full pr-10 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <select
              value={returnFilter}
              onChange={(e) => setReturnFilter(e.target.value)}
              className="w-full py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              <option value="all">{t.allTypes}</option>
              <option value="sale">{t.sales}</option>
              <option value="return">{t.returns}</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              <option value="all">{t.allPaymentMethods}</option>
              <option value="cash">{t.cash}</option>
              <option value="card">{t.card}</option>
              <option value="online">{t.online}</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.receiptNumber}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.date}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.customer}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.amount}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.paymentMethod}
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.type}
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">{t.view}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    {t.loading}
                  </td>
                </tr>
              ) : filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    {t.noReceipts}
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((receipt) => (
                  <tr key={receipt.receipt_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {receipt.receipt_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(receipt.receipt_date), 'PPpp', {
                        locale: language === 'ar' ? arSA : undefined
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {receipt.customer_name ? (
                        <div>
                          <div>{receipt.customer_name}</div>
                          <div className="text-xs text-gray-400">{receipt.customer_phone}</div>
                        </div>
                      ) : (
                        t.guestCustomer
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {receipt.total_amount.toFixed(3)} {t.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {receipt.payment_method === 'cash' ? t.cash :
                       receipt.payment_method === 'card' ? t.card : t.online}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        receipt.is_return ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {receipt.is_return ? t.returned : t.completed}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                      <button 
                        onClick={() => handleViewReceipt(receipt)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {t.view}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Modal */}
      {showModal && selectedReceipt && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">{t.receiptNumber}: {selectedReceipt.receipt_id}</h2>
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  {/* Printer Width Selection */}
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <label className="text-sm text-gray-600">{t.printerSize}:</label>
                    <select
                      value={selectedPrinterWidth}
                      onChange={(e) => setSelectedPrinterWidth(e.target.value as '57mm' | '80mm' | '85mm')}
                      className="text-sm border rounded p-1"
                    >
                      <option value="57mm">57mm</option>
                      <option value="80mm">80mm</option>
                      <option value="85mm">85mm</option>
                    </select>
                  </div>
                  <button
                    onClick={() => handlePrint(selectedReceipt)}
                    disabled={isPrinting}
                    className={`bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors flex items-center space-x-2 rtl:space-x-reverse ${
                      isPrinting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Printer className="w-4 h-4" />
                    <span>{isPrinting ? t.printing : t.print}</span>
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
              
              <div className="font-mono bg-white p-6 rounded-lg shadow-inner border text-center whitespace-pre-wrap" style={{ direction: 'ltr' }}>
                {selectedReceipt.long_text_receipt ? (
                  selectedReceipt.long_text_receipt
                ) : (
                  <div className="text-left space-y-2">
                    <div className="text-center font-bold text-lg mb-4">
                      {settings?.business_name}
                    </div>
                    <div>
                      {t.date}: {format(new Date(selectedReceipt.created_at), 'yyyy/MM/dd hh:mm a', { locale: language === 'ar' ? arSA : undefined })}
                    </div>
                    <div>
                      {t.receiptNumber}: {selectedReceipt.receipt_id}
                    </div>
                    {selectedReceipt.branch_name && (
                      <div>Branch: {selectedReceipt.branch_name}</div>
                    )}
                    {selectedReceipt.cashier_name && (
                      <div>Cashier: {selectedReceipt.cashier_name}</div>
                    )}
                    <div>
                      {t.customer}: {selectedReceipt.customer_name || t.guestCustomer}
                    </div>
                    {selectedReceipt.customer_phone && (
                      <div>Phone: {selectedReceipt.customer_phone}</div>
                    )}
                    <div className="border-t border-b py-2 my-2">
                      <div>
                        {t.amount}: {selectedReceipt.total_amount} {t.currency}
                      </div>
                      {selectedReceipt.discount > 0 && (
                        <div>
                          {t.discount}: {selectedReceipt.discount} {t.currency}
                        </div>
                      )}
                      {selectedReceipt.tax > 0 && (
                        <div>
                          {t.tax}: {selectedReceipt.tax} {t.currency}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      {t.paymentMethod}: {t[selectedReceipt.payment_method as PaymentMethod]}
                    </div>
                    
                    {selectedReceipt.is_return && (
                      <>
                        <div>Return Receipt</div>
                        {selectedReceipt.return_reason && (
                          <div>Return Reason: {selectedReceipt.return_reason}</div>
                        )}
                      </>
                    )}
                    
                    {selectedReceipt.note && (
                      <div>
                        {t.note}: {selectedReceipt.note}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Error Alert */}
      {printError && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong className="font-bold">{t.printError}</strong>
          <span className="block sm:inline"> {printError.message}</span>
        </div>
      )}
    </div>
  );
}