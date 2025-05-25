import React, { useMemo } from 'react';
import { BaseReport } from '../BaseReport';
import { useMonthlySalesReport } from './useMonthlySalesReport';
import type { ReportProps } from '../types';
import { useLanguageStore } from '../../../store/useLanguageStore';
import { reportTranslations } from '../../../translations/reports';
import { Download } from 'lucide-react';
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

interface MonthlySalesReportProps extends ReportProps {
  businessCode: string;
}

export function MonthlySalesReport({
  businessCode,
  selectedBranch,
  dateRange
}: MonthlySalesReportProps) {
  const { language } = useLanguageStore();
  const t = reportTranslations[language];
  
  // Fetch monthly sales data
  const salesData = useMonthlySalesReport({
    businessCode,
    branchName: selectedBranch,
    startDate: dateRange.startDate,
    endDate: dateRange.endDate
  });

  // Configure chart options
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: t.monthlySales,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const value = context.raw || 0;
            return `${t.amount}: ${value.toFixed(2)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => value.toFixed(2)
        }
      }
    }
  }), [language, t]);

  // Export data to Excel
  const exportToExcel = () => {
    if (!salesData.data) return;
    
    // Prepare data for export
    const exportData = salesData.data.labels.map((month, index) => ({
      [t.date]: month,
      [t.amount]: salesData.data.datasets[0].data[index]
    }));

    // Add total row
    exportData.push({
      [t.date]: t.totalTransactions,
      [t.amount]: salesData.data.totals.totalSales
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const colWidths = [
      { wch: 20 }, // date
      { wch: 15 }, // amount
    ];
    ws['!cols'] = colWidths;

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Sales');

    // Generate Excel file
    const fileName = `monthly_sales_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  // Render the chart
  const renderSalesChart = (data: any) => {
    if (!data || !data.labels || data.labels.length === 0) {
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
            <h3 className="text-lg font-medium">{t.monthlySales}</h3>
            <p className="text-sm text-gray-500">
              {t.totalTransactions}: {data.totals.totalSales.toFixed(2)}
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
        
        <div className="h-80">
          <Bar options={chartOptions} data={data} />
        </div>
      </div>
    );
  };

  return (
    <BaseReport
      title={t.monthlySales}
      data={salesData}
      renderContent={renderSalesChart}
    />
  );
}
