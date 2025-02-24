import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import type { CashTracking } from '../../services/cashTrackingService';

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
  cashRecords: CashTracking[];
  language: 'en' | 'ar';
}

export function CashBalanceChart({ cashRecords, language }: Props) {
  // Reverse the array to show oldest to newest (left to right)
  const orderedRecords = [...cashRecords].reverse();
  
  const data = {
    labels: orderedRecords.map(record => new Date(record.transaction_date).toLocaleDateString()),
    datasets: [
      {
        label: language === 'ar' ? 'إجمالي النقد' : 'Total Cash',
        data: orderedRecords.map(record => record.new_total_cash),
        borderColor: 'rgb(30, 64, 175)', // Darker blue
        backgroundColor: 'rgba(30, 64, 175, 0.1)',
        borderWidth: 2,
        tension: 0.4
      },
      {
        label: language === 'ar' ? 'الإضافات النقدية' : 'Cash Additions',
        data: orderedRecords.map(record => record.cash_additions),
        borderColor: 'rgb(185, 28, 28)', // Dark red
        backgroundColor: 'rgba(185, 28, 28, 0.1)',
        borderWidth: 2,
        tension: 0.4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          padding: 20,
          font: {
            size: 14
          }
        }
      },
      title: {
        display: true,
        text: language === 'ar' ? 'تتبع النقد' : 'Cash Tracking',
        padding: 20,
        font: {
          size: 18
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          padding: 10,
          font: {
            size: 13
          }
        }
      },
      x: {
        ticks: {
          padding: 10,
          font: {
            size: 13
          }
        }
      }
    },
    layout: {
      padding: {
        left: 20,
        right: 20,
        top: 0,
        bottom: 10
      }
    }
  };

  return (
    <div className="w-full h-[600px] px-4"> 
      <Line options={options} data={data} />
    </div>
  );
}
