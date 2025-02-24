import { useState, useEffect } from 'react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { vendorSpacesTranslations } from '../../translations/vendorSpaces';
import { getRentalStats, type RentalStats } from '../../services/vendorRentalStatsService';
import { Building2, CheckCircle, Clock, DollarSign } from 'lucide-react';

interface Props {
  businessCode: string;
  month: number;
  year: number;
  refreshTrigger?: number;
}

export function RentalStats({ businessCode, month, year, refreshTrigger = 0 }: Props) {
  const { language } = useLanguageStore();
  const t = vendorSpacesTranslations[language];
  const [stats, setStats] = useState<RentalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, [businessCode, month, year, refreshTrigger]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRentalStats(businessCode, month, year);
      setStats(data);
    } catch (err) {
      console.error('Error loading rental stats:', err);
      setError(t.errorLoadingStats);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-gray-600 text-center">{t.loading}</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="text-red-600 text-center">{error || t.errorLoadingStats}</div>
      </div>
    );
  }

  const isRTL = language === 'ar';
  const statItems = [
    {
      icon: Building2,
      label: t.totalSpaces,
      value: stats.totalSpaces,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      icon: CheckCircle,
      label: t.paidSpaces,
      value: stats.totalPaid,
      subValue: `${stats.paidAmount.toFixed(2)} OMR`,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      icon: Clock,
      label: t.pendingSpaces,
      value: stats.totalPending,
      subValue: `${stats.pendingAmount.toFixed(2)} OMR`,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      icon: DollarSign,
      label: t.totalAmount,
      value: `${stats.totalAmount.toFixed(2)} OMR`,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statItems.map((item, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-4">
          <div className={`flex items-center ${isRTL ? 'space-x-reverse' : ''} space-x-3`}>
            <div className={`p-2 rounded-lg ${item.bgColor}`}>
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <div className={`flex flex-col ${isRTL ? 'text-right' : 'text-left'}`}>
              <span className="text-sm text-gray-600">{item.label}</span>
              <span className={`text-xl font-semibold ${item.color}`}>
                {item.value}
              </span>
              {item.subValue && (
                <span className="text-sm text-gray-500">{item.subValue}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
