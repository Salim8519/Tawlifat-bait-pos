import React from 'react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { reportTranslations } from '../../translations/reports';
import type { ReportProps, ReportData } from './types';

interface BaseReportProps extends ReportProps {
  title: string;
  data: ReportData;
  renderContent: (data: any) => React.ReactNode;
}

export function BaseReport({
  title,
  data,
  renderContent
}: BaseReportProps) {
  const { language } = useLanguageStore();
  const t = reportTranslations[language];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className="aspect-[4/3] bg-gray-50 rounded-lg">
        {data.isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">{t.loading}</p>
          </div>
        ) : data.error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-500">{data.error}</p>
          </div>
        ) : (
          renderContent(data.data)
        )}
      </div>
    </div>
  );
}
