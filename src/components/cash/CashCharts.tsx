import React, { useMemo } from 'react';
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
  ChartOptions,
  Chart
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { useLanguageStore } from '../../store/useLanguageStore';
import { cashDrawerTranslations } from '../../translations/cashDrawer';
import type { Transaction } from '../../store/useCashDrawerStore';
import { format, startOfDay, eachDayOfInterval, subDays } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';

// Register Chart.js components
if (!Chart.getChart("cash-balance-chart")) {
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
}

interface Props {
  transactions: Transaction[];
}

export function CashCharts({ transactions }: Props) {
  const { language } = useLanguageStore();
  const t = cashDrawerTranslations[language];
  const locale = language === 'ar' ? arSA : enUS;

  const last30Days = useMemo(() => {
    const end = startOfDay(new Date());
    const start = subDays(end, 29);
    return eachDayOfInterval({ start, end });
  }, []);

  const chartData = useMemo(() => {
    const dailyBalances = new Map<string, number>();
    const dailyTransactions = new Map<string, { deposits: number; withdrawals: number }>();
    let runningBalance = 0;

    // Initialize all days with zero values
    last30Days.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      dailyTransactions.set(dateStr, { deposits: 0, withdrawals: 0 });
    });

    // Process transactions
    transactions.forEach(transaction => {
      const date = format(new Date(transaction.date), 'yyyy-MM-dd');
      if (dailyTransactions.has(date)) {
        const current = dailyTransactions.get(date)!;
        if (transaction.type === 'deposit') {
          current.deposits += transaction.amount;
        } else {
          current.withdrawals += transaction.amount;
        }
        dailyTransactions.set(date, current);
      }
    });

    // Calculate running balance for each day
    last30Days.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayTransactions = dailyTransactions.get(dateStr)!;
      runningBalance += dayTransactions.deposits - dayTransactions.withdrawals;
      dailyBalances.set(dateStr, runningBalance);
    });

    return {
      labels: last30Days.map(date => format(date, 'MMM d', { locale })),
      balances: Array.from(dailyBalances.values()),
      transactions: Array.from(dailyTransactions.values())
    };
  }, [transactions, last30Days, locale]);

  const balanceChartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        rtl: language === 'ar',
        labels: {
          boxWidth: 10,
          usePointStyle: true,
        }
      },
      title: {
        display: true,
        text: t.balanceOverTime
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

  const transactionsChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        rtl: language === 'ar',
        labels: {
          boxWidth: 10,
          usePointStyle: true,
        }
      },
      title: {
        display: true,
        text: t.dailyTransactions
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

  const balanceChartData = {
    labels: chartData.labels,
    datasets: [
      {
        label: t.balance,
        data: chartData.balances,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        tension: 0.4
      }
    ]
  };

  const transactionsChartData = {
    labels: chartData.labels,
    datasets: [
      {
        label: t.deposits,
        data: chartData.transactions.map(t => t.deposits),
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1
      },
      {
        label: t.withdrawals,
        data: chartData.transactions.map(t => t.withdrawals),
        backgroundColor: 'rgba(239, 68, 68, 0.5)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow p-4">
        <Line id="cash-balance-chart" options={balanceChartOptions} data={balanceChartData} />
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <Bar id="cash-transactions-chart" options={transactionsChartOptions} data={transactionsChartData} />
      </div>
    </div>
  );
}