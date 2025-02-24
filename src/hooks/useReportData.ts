import { useState, useEffect } from 'react';
import type { ReportData } from '../components/reports/types';

interface UseReportDataProps {
  fetchData: () => Promise<any>;
  dependencies?: any[];
}

export function useReportData({ fetchData, dependencies = [] }: UseReportDataProps): ReportData {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await fetchData();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, dependencies);

  return {
    isLoading,
    error,
    data
  };
}
