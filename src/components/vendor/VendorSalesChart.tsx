import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useLanguageStore } from '../../store/useLanguageStore';
import { vendorDashboardTranslations } from '../../translations/vendorDashboard';
import { format, eachDayOfInterval, subDays } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export function VendorSalesChart() {
  const { language } = useLanguageStore();
  const t = vendorDashboardTranslations[language];
  const locale = language === 'ar' ? arSA : enUS;

  // Generate last 30 days
  const last30Days = React.useMemo(() => {
    const end = new Date();
    const start = subDays(end, 29);
    return eachDayOfInterval({ start, end });
  }, []);

  // Mock data - replace with API calls
  const mockData = React.useMemo(() => ({
    labels: last30Days.map(date => format(date, 'MMM d', { locale })),
    data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 1000))
  }), [last30Days, locale]);

  const options: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        rtl: language === 'ar',
        labels: {
          boxWidth: 10,
          usePointStyle: true
        }
      },
      title: {
        display: true,
        text: t.salesOverTime
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: value => `${value} ${t.currency}`
        }
      }
    }
  };

  const data = {
    labels: mockData.labels,
    datasets: [
      {
        label: t.salesAmount,
        data: mockData.data,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        tension: 0.4
      }
    ]
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <Line options={options} data={data} />
    </div>
  );
}