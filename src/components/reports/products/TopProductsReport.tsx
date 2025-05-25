import React, { useMemo } from 'react';
import { BaseReport } from '../BaseReport';
import { useTopProductsReport } from './useTopProductsReport';
import type { ReportProps } from '../types';
import type { ProductSalesData } from './types';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { reportTranslations } from '../../../translations/reports';
import { Download, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TopProductsReportProps extends ReportProps {
  businessCode: string;
}

export function TopProductsReport({
  businessCode,
  selectedBranch,
  dateRange
}: TopProductsReportProps) {
  const { language } = useLanguageStore();
  const t = reportTranslations[language];
  const isRTL = language === 'ar';
  
  // Fetch top products data
  const topProductsData = useTopProductsReport({
    businessCode,
    branchName: selectedBranch,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    filters: { limit: 10 } // Show top 10 products
  });

  // Configure chart options
  const chartOptions = useMemo(() => ({
    indexAxis: 'y' as const, // Horizontal bar chart
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: t.topSellingProducts,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw || 0;
            return `${context.dataset.label}: ${value.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => value.toFixed(0)
        }
      }
    }
  }), [language, t]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!topProductsData.data?.products) return null;
    
    const products = [...topProductsData.data.products].reverse(); // Reverse to show highest at top
    
    return {
      labels: products.map(product => product.product_name),
      datasets: [
        {
          label: t.quantity,
          data: products.map(product => product.quantity_sold),
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          borderColor: 'rgba(53, 162, 235, 1)',
          borderWidth: 1,
        }
      ]
    };
  }, [topProductsData.data, t]);

  // Export data to Excel
  const exportToExcel = () => {
    if (!topProductsData.data?.products) return;
    
    // Prepare data for export
    const exportData = topProductsData.data.products.map(product => ({
      [t.product]: product.product_name,
      [t.quantity]: product.quantity_sold,
      [t.unitPrice]: product.unit_price.toFixed(2),
      [t.totalSales]: product.total_sales.toFixed(2)
    }));

    // Add total row
    exportData.push({
      [t.product]: t.total,
      [t.quantity]: topProductsData.data.totals.totalQuantity,
      [t.unitPrice]: '',
      [t.totalSales]: topProductsData.data.totals.totalSales.toFixed(2)
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const colWidths = [
      { wch: 30 }, // product
      { wch: 10 }, // quantity
      { wch: 12 }, // unitPrice
      { wch: 12 }, // totalSales
    ];
    ws['!cols'] = colWidths;

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Top Products');

    // Generate Excel file
    const fileName = `top_products_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Render the products table
  const renderProductsTable = (data: any) => {
    if (!data || !data.products || data.products.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">{t.noTransactions}</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h3 className="text-lg font-medium">{t.topSellingProducts}</h3>
            <p className="text-sm text-gray-500">
              {t.totalSales}: {data.totals.totalSales.toFixed(2)}
            </p>
          </div>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100"
          >
            <Download size={16} />
            <span>{t.downloadExcel}</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Chart */}
          <div className="h-80">
            {chartData && <Bar options={chartOptions} data={chartData} />}
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.product}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.quantity}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.totalSales}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.products.map((product: ProductSalesData, index: number) => (
                  <tr key={product.product_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.product_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {product.quantity_sold}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                      {product.total_sales.toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-100">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    {t.total}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                    {data.totals.totalQuantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-right">
                    {data.totals.totalSales.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <BaseReport
      title={t.topSellingProducts}
      data={topProductsData}
      renderContent={renderProductsTable}
    />
  );
}
