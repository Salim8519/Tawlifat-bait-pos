import React, { useMemo } from 'react';
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
import { returnsTranslations } from '../../translations/returns';
import { format, startOfDay, eachDayOfInterval, subDays } from 'date-fns';
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

interface Props {
  returns: Array<{
    date: string;
    amount: number;
  }>;
}

export function ReturnsChart({ returns }: Props) {
  const { language } = useLanguageStore();
  const t = returnsTranslations[language];
  const locale = language === 'ar' ? arSA : enUS;

  const last30Days = useMemo(() => {
    const end = startOfDay(new Date());
    const start = subDays(end, 29);
    return eachDayOfInterval({ start, end });
  }, []);

  const chartData = useMemo(() => {
    const dailyReturns = new Map<string, number>();

    // Initialize all days with zero
    last30Days.forEach(date => {
      dailyReturns.set(format(date, 'yyyy-MM-dd'), 0);
    });

    // Sum returns by day
    returns.forEach(item => {
      const date = format(new Date(item.date), 'yyyy-MM-dd');
      if (dailyReturns.has(date)) {
        dailyReturns.set(date, (dailyReturns.get(date) || 0) + item.amount);
      }
    });

    return {
      labels: last30Days.map(date => format(date, 'MMM d', { locale })),
      data: Array.from(dailyReturns.values())
    };
  }, [returns, last30Days, locale]);

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
        text: t.returnsOverTime
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
    labels: chartData.labels,
    datasets: [
      {
        label: t.returnsAmount,
        data: chartData.data,
        borderColor: 'rgb(234, 88, 12)',
        backgroundColor: 'rgba(234, 88, 12, 0.5)',
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