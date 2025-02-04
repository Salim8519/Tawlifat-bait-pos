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
  ChartData,
  ChartOptions
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useLanguageStore } from '../../store/useLanguageStore';
import { format, parseISO } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';
import type { Transaction } from '../../types/pos';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface CashFlowChartsProps {
  transactions: Transaction[];
}

export function CashFlowCharts({ transactions }: CashFlowChartsProps) {
  const { language } = useLanguageStore();
  const locale = language === 'ar' ? arSA : enUS;
  const isRTL = language === 'ar';

  // Process data for charts
  const processedData = transactions.reduce((acc, transaction) => {
    const date = format(parseISO(transaction.date), 'dd/MM/yyyy', { locale });
    
    // For bar chart - daily transactions
    if (!acc.barData[date]) {
      acc.barData[date] = {
        deposits: 0,
        withdrawals: 0
      };
    }
    
    if (transaction.type === 'deposit') {
      acc.barData[date].deposits += transaction.amount;
    } else {
      acc.barData[date].withdrawals += transaction.amount;
    }
    
    // For line chart - accumulative balance
    const lastBalance = acc.lineData[acc.lineData.length - 1]?.balance || 0;
    acc.lineData.push({
      date,
      balance: lastBalance + (transaction.type === 'deposit' ? transaction.amount : -transaction.amount)
    });
    
    return acc;
  }, {
    barData: {} as Record<string, { deposits: number; withdrawals: number }>,
    lineData: [] as Array<{ date: string; balance: number }>
  });

  // Prepare data for charts
  const dates = Object.keys(processedData.barData);
  
  const lineChartData: ChartData<'line'> = {
    labels: processedData.lineData.map(d => d.date),
    datasets: [
      {
        label: language === 'ar' ? 'الرصيد التراكمي' : 'Accumulative Balance',
        data: processedData.lineData.map(d => d.balance),
        borderColor: 'rgb(75, 85, 199)',
        backgroundColor: 'rgba(75, 85, 199, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const barChartData: ChartData<'bar'> = {
    labels: dates,
    datasets: [
      {
        label: language === 'ar' ? 'الإيداعات' : 'Deposits',
        data: dates.map(date => processedData.barData[date].deposits),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
      },
      {
        label: language === 'ar' ? 'السحوبات' : 'Withdrawals',
        data: dates.map(date => processedData.barData[date].withdrawals),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
      }
    ]
  };

  const chartOptions: ChartOptions<'line' | 'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        rtl: isRTL,
        labels: {
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        rtl: isRTL,
        textDirection: isRTL ? 'rtl' : 'ltr',
        titleAlign: isRTL ? 'right' : 'left',
        bodyAlign: isRTL ? 'right' : 'left'
      }
    },
    scales: {
      x: {
        reverse: isRTL,
        grid: {
          display: false
        }
      },
      y: {
        position: isRTL ? 'right' : 'left',
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  };

  return (
    <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Accumulative Balance Line Chart */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">
          {language === 'ar' ? 'الرصيد التراكمي' : 'Accumulative Balance'}
        </h3>
        <div className="h-80">
          <Line data={lineChartData} options={chartOptions} />
        </div>
      </div>

      {/* Daily Transactions Bar Chart */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-4">
          {language === 'ar' ? 'المعاملات اليومية' : 'Daily Transactions'}
        </h3>
        <div className="h-80">
          <Bar data={barChartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
