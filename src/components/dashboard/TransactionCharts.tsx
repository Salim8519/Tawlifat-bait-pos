import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { TransactionInsights } from '../../services/dashboardService';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface TransactionChartsProps {
  insights: TransactionInsights;
  language: 'en' | 'ar';
  currency: string;
}

export function TransactionCharts({ insights, language, currency }: TransactionChartsProps) {
  const isRTL = language === 'ar';
  const chartDirection = isRTL ? 'rtl' : 'ltr';

  // Daily transactions chart data
  const dailyData = {
    labels: insights.dailyTransactions.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: language === 'ar' ? 'عدد المعاملات' : 'Transactions',
        data: insights.dailyTransactions.map(d => d.count),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.2)',
        yAxisID: 'y',
        tension: 0.4,
        borderWidth: 2,
      },
      {
        label: language === 'ar' ? 'المبلغ' : 'Amount',
        data: insights.dailyTransactions.map(d => d.amount),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        yAxisID: 'y1',
        tension: 0.4,
        borderWidth: 2,
      },
    ],
  };

  const dailyTransactionsOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          boxWidth: 8,
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      title: {
        display: true,
        text: language === 'ar' ? 'المعاملات اليومية' : 'Daily Transactions',
        font: {
          size: 13,
          weight: '500',
        },
        padding: { bottom: 15 },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: false,
        },
        grid: {
          color: 'rgba(0,0,0,0.05)',
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: false,
        },
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
  };

  // Hourly distribution chart data
  const hourlyData = {
    labels: insights.hourlyDistribution.map(h => `${h.hour}:00`),
    datasets: [
      {
        label: language === 'ar' ? 'المعاملات' : 'Transactions',
        data: insights.hourlyDistribution.map(h => h.count),
        backgroundColor: 'rgba(53, 162, 235, 0.3)',
        borderColor: 'rgb(53, 162, 235)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const hourlyDistributionOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: language === 'ar' ? 'التوزيع بالساعة' : 'Hourly Distribution',
        font: {
          size: 13,
          weight: '500',
        },
        padding: { bottom: 15 },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.05)',
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
    },
  };

  // Payment methods translations and data preparation
  const paymentMethodTranslations = {
    cash: language === 'ar' ? 'نقداً' : 'Cash',
    card: language === 'ar' ? 'بطاقة' : 'Card',
    online: language === 'ar' ? 'إلكتروني' : 'Online'
  };

  const paymentMethodsOrder = ['cash', 'card', 'online'];
  const paymentData = {
    labels: paymentMethodsOrder.map(method => paymentMethodTranslations[method as keyof typeof paymentMethodTranslations]),
    datasets: [
      {
        data: paymentMethodsOrder.map(method => {
          const methodData = insights.transactionsByPaymentMethod[method];
          return methodData ? methodData.count : 0;
        }),
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',  // Cash - Blue
          'rgba(75, 192, 192, 0.6)',  // Card - Teal
          'rgba(255, 159, 64, 0.6)',  // Online - Orange
        ],
        borderColor: [
          'rgb(54, 162, 235)',
          'rgb(75, 192, 192)',
          'rgb(255, 159, 64)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const paymentMethodsOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 8,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 11,
          },
          generateLabels: (chart) => {
            const datasets = chart.data.datasets?.[0];
            const labels = chart.data.labels;
            if (!datasets || !labels) return [];

            return labels.map((label, i) => {
              const methodKey = paymentMethodsOrder[i];
              const methodData = insights.transactionsByPaymentMethod[methodKey];
              const count = methodData ? methodData.count : 0;
              const amount = methodData ? methodData.amount : 0;
              
              return {
                text: `${label} (${count})`,
                fillStyle: datasets.backgroundColor?.[i] as string,
                strokeStyle: datasets.borderColor?.[i] as string,
                pointStyle: 'circle',
                index: i,
                hidden: false
              };
            });
          }
        },
      },
      title: {
        display: true,
        text: language === 'ar' ? 'طرق الدفع' : 'Payment Methods',
        font: {
          size: 13,
          weight: '500',
        },
        padding: { bottom: 15 },
      },
    },
    cutout: '70%',
  };

  return (
    <div className="space-y-6" dir={chartDirection}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <Line options={dailyTransactionsOptions} data={dailyData} />
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <Bar options={hourlyDistributionOptions} data={hourlyData} />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <Doughnut options={paymentMethodsOptions} data={paymentData} />
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'البائع' : 'Vendor'}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'المعاملات' : 'Transactions'}
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {language === 'ar' ? 'المبلغ' : 'Amount'}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {insights.topVendors.map((vendor, index) => (
                  <tr key={index} className="text-sm">
                    <td className="px-3 py-2 whitespace-nowrap">{vendor.vendor_name}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{vendor.transaction_count}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {vendor.total_amount.toFixed(2)} {currency}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
