import React from 'react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { reportTranslations } from '../../translations/reports';

export type ReportType = 'transactions' | 'sales' | 'products' | 'inventory';

interface ReportSelectorProps {
  selectedReport: ReportType;
  onReportChange: (report: ReportType) => void;
}

export function ReportSelector({ selectedReport, onReportChange }: ReportSelectorProps) {
  const { language } = useLanguageStore();
  const t = reportTranslations[language];

  const reports: { type: ReportType; label: string }[] = [
    { type: 'transactions', label: t.transactionSummary },
    { type: 'sales', label: t.monthlySales },
    { type: 'products', label: t.topSellingProducts },
    { type: 'inventory', label: t.inventory }
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {reports.map(({ type, label }) => (
        <button
          key={type}
          onClick={() => onReportChange(type)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
            ${selectedReport === type
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
