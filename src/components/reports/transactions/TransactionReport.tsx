import React, { useState, useMemo } from 'react';
import { BaseReport } from '../BaseReport';
import { useTransactionReport } from './useTransactionReport';
import type { ReportProps } from '../types';
import type { TransactionFilters } from './types';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { reportTranslations } from '../../../translations/reports';
import { TransactionFilters as TransactionFiltersComponent } from './TransactionFilters';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const formatTransactionDetails = (details: any): { formattedDetails: string, summary: string } => {
  if (!details) return { formattedDetails: '-', summary: '-' };

  try {
    // If details is a string, try to parse it
    const detailsObj = typeof details === 'string' ? JSON.parse(details) : details;

    // Create a readable summary based on the content
    let summary = '';
    if (detailsObj.type === 'vendor_rental') {
      summary = `Rental: ${detailsObj.vendor_details?.name || 'Unknown Vendor'}`;
    } else if (detailsObj.products) {
      const productCount = detailsObj.products.length;
      const totalAmount = detailsObj.total;
      summary = `${productCount} product${productCount > 1 ? 's' : ''}, Total: ${totalAmount} OMR`;
    }

    // Format the full details for the expanded view
    const formattedDetails = JSON.stringify(detailsObj, null, 2)
      .replace(/"([^"]+)":/g, '$1:') // Remove quotes from property names
      .replace(/[{[]/g, (match) => `${match}\n  `) // Add indentation after { and [
      .replace(/[}\]]/g, (match) => `\n${match}`); // Add newline before } and ]

    return { formattedDetails, summary };
  } catch (error) {
    // If parsing fails, return the original content
    return {
      formattedDetails: String(details),
      summary: String(details).slice(0, 50) + (String(details).length > 50 ? '...' : '')
    };
  }
};

const exportToExcel = (data: any[], language: string, t: any) => {
  // Prepare data for export
  const exportData = data.map(transaction => {
    const { summary } = formatTransactionDetails(transaction.details);
    return {
      [t.date]: format(new Date(transaction.transaction_date), 'yyyy-MM-dd HH:mm'),
      [t.transactionId]: transaction.transaction_id,
      [t.branch]: transaction.branch_name,
      [t.transactionType]: t[transaction.transaction_type as keyof typeof t] || transaction.transaction_type,
      [t.amount]: transaction.amount,
      [t.ownerProfit]: transaction.owner_profit_from_this_transcation || 0,
      [t.paymentMethod]: t[transaction.payment_method as keyof typeof t] || transaction.payment_method,
      [t.vendorName]: transaction.vendor_name || '-',
      [t.transactionReason]: transaction.transaction_reason || '-',
      [t.details]: summary
    };
  });

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData, {
    header: [
      t.date,
      t.transactionId,
      t.branch,
      t.transactionType,
      t.amount,
      t.ownerProfit,
      t.paymentMethod,
      t.vendorName,
      t.transactionReason,
      t.details
    ]
  });

  // Set column widths
  const colWidths = [
    { wch: 20 }, // date
    { wch: 15 }, // transactionId
    { wch: 15 }, // branch
    { wch: 15 }, // transactionType
    { wch: 12 }, // amount
    { wch: 12 }, // ownerProfit
    { wch: 15 }, // paymentMethod
    { wch: 20 }, // vendorName
    { wch: 25 }, // transactionReason
    { wch: 40 }, // details
  ];
  ws['!cols'] = colWidths;

  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

  // Generate Excel file
  const fileName = `transactions_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

interface TransactionReportProps extends ReportProps {
  businessCode: string;
}

export function TransactionReport({
  businessCode,
  selectedBranch,
  dateRange
}: TransactionReportProps) {
  const { language } = useLanguageStore();
  const t = reportTranslations[language];
  const [filters, setFilters] = useState<TransactionFilters>({});
  
  const reportData = useTransactionReport({
    businessCode,
    branchName: selectedBranch,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    filters
  });

  const filterOptions = useMemo(() => {
    if (!reportData.data) return {
      paymentMethods: [],
      transactionTypes: [],
      statuses: [],
      vendors: []
    };

    const options = {
      paymentMethods: Object.keys(reportData.data.byPaymentMethod),
      transactionTypes: Object.keys(reportData.data.byTransactionType),
      statuses: Object.keys(reportData.data.byStatus),
      vendors: Object.entries(reportData.data.byVendor).map(([code, stats]) => ({
        code,
        name: reportData.data.recentTransactions.find(t => t.vendor_code === code)?.vendor_name || code
      }))
    };

    return options;
  }, [reportData.data]);

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(3)} OMR`;
  };

  const renderContent = (data: any) => (
    <div className="space-y-8">
      {/* Filters */}
      <TransactionFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        {...filterOptions}
      />

      {/* Overall Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-blue-800 mb-2">{t.totalTransactions}</h3>
          <p className="text-3xl font-bold text-blue-900">
            {data.totalTransactions}
          </p>
          <p className="mt-2 text-lg font-semibold text-blue-700">
            {formatCurrency(data.totalAmount)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-emerald-800 mb-2">{t.ownerSales}</h3>
          <p className="text-3xl font-bold text-emerald-900">
            {data.ownerTransactions.count}
          </p>
          <p className="mt-2 text-lg font-semibold text-emerald-700">
            {formatCurrency(data.ownerTransactions.profit)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-violet-50 to-violet-100 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-violet-800 mb-2">{t.vendorSales}</h3>
          <p className="text-3xl font-bold text-violet-900">
            {data.vendorTransactions.count}
          </p>
          <p className="mt-2 text-lg font-semibold text-violet-700">
            {formatCurrency(data.vendorTransactions.profit)}
          </p>
        </div>
      </div>

      {/* Statistics Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Methods */}
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className={`text-lg font-semibold text-gray-900 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              {t.paymentMethodsTitle}
            </h3>
          </div>
          <div>
            <div className={`bg-gray-50 px-6 py-4 grid grid-cols-4 gap-4 text-sm font-medium text-gray-600 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              <div>{t.method}</div>
              <div>{t.count}</div>
              <div>{t.amount}</div>
              <div>{t.profit}</div>
            </div>
            <div className="divide-y divide-gray-100">
              {Object.entries(data.byPaymentMethod).map(([method, stats]: [string, any]) => (
                <div key={method} className={`px-6 py-4 grid grid-cols-4 gap-4 hover:bg-gray-50 transition-colors ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  <div className="text-sm font-medium text-gray-900">{t[method as keyof typeof t] || method}</div>
                  <div className="text-sm text-gray-600">{stats.count}</div>
                  <div className="text-sm font-medium text-gray-900">{formatCurrency(stats.amount)}</div>
                  <div className="text-sm font-medium text-emerald-600">{formatCurrency(stats.profit)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transaction Types */}
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <h3 className={`text-lg font-semibold text-gray-900 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              {t.transactionTypeTitle}
            </h3>
          </div>
          <div>
            <div className={`bg-gray-50 px-6 py-4 grid grid-cols-4 gap-4 text-sm font-medium text-gray-600 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
              <div>{t.method}</div>
              <div>{t.count}</div>
              <div>{t.amount}</div>
              <div>{t.profit}</div>
            </div>
            <div className="divide-y divide-gray-100">
              {Object.entries(data.byTransactionType).map(([type, stats]: [string, any]) => (
                <div key={type} className={`px-6 py-4 grid grid-cols-4 gap-4 hover:bg-gray-50 transition-colors ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  <div className="text-sm font-medium text-gray-900">{t[type as keyof typeof t] || type}</div>
                  <div className="text-sm text-gray-600">{stats.count}</div>
                  <div className="text-sm font-medium text-gray-900">{formatCurrency(stats.amount)}</div>
                  <div className="text-sm font-medium text-emerald-600">{formatCurrency(stats.profit)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
          <h3 className={`text-lg font-semibold text-gray-900 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            {t.recentTransactions}
          </h3>
          <button
            onClick={() => exportToExcel(data.recentTransactions, language, t)}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Download className="w-4 h-4 mr-2" />
            {t.exportReport}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y divide-gray-200 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            <thead>
              <tr className="bg-gray-50">
                <th className={`px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t.date}
                </th>
                <th className={`px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t.transactionId}
                </th>
                <th className={`px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t.branch}
                </th>
                <th className={`px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t.transactionType}
                </th>
                <th className={`px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t.amount}
                </th>
                <th className={`px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t.ownerProfit}
                </th>
                <th className={`px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t.paymentMethod}
                </th>
                <th className={`px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t.vendorName}
                </th>
                <th className={`px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t.transactionReason}
                </th>
                <th className={`px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                  {t.details}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {data.recentTransactions.length > 0 ? (
                data.recentTransactions.map((transaction: any) => (
                  <tr key={transaction.transaction_id} className="hover:bg-gray-50 transition-colors">
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      {format(new Date(transaction.transaction_date), 'yyyy-MM-dd HH:mm')}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-600 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      {transaction.transaction_id.slice(0, 8)}...
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-600 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      {transaction.branch_name}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-600 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      {t[transaction.transaction_type as keyof typeof t] || transaction.transaction_type}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${transaction.owner_profit_from_this_transcation > 0 ? 'text-emerald-600' : 'text-gray-900'} ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      {transaction.owner_profit_from_this_transcation ? formatCurrency(transaction.owner_profit_from_this_transcation) : '-'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-600 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      {t[transaction.payment_method as keyof typeof t] || transaction.payment_method}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-600 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      {transaction.vendor_name || '-'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-gray-600 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      {transaction.transaction_reason || '-'}
                    </td>
                    <td className={`px-6 py-4 text-sm text-gray-600 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                      {transaction.details ? (
                        <div className="group relative">
                          <div className="cursor-pointer">
                            {formatTransactionDetails(transaction.details).summary}
                          </div>
                          <div className="hidden group-hover:block absolute z-10 top-0 left-0 mt-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-lg">
                            <pre className="text-xs whitespace-pre-wrap break-words bg-gray-50 p-2 rounded">
                              {formatTransactionDetails(transaction.details).formattedDetails}
                            </pre>
                          </div>
                        </div>
                      ) : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-4 text-center text-sm text-gray-500">
                    {t.noTransactions}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <BaseReport
      title={t.transactionSummary}
      data={reportData}
      renderContent={renderContent}
    />
  );
}
