import React from 'react';
import { useLanguageStore } from '../../store/useLanguageStore';
import { dashboardTranslations } from '../../translations/dashboard';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TransactionSummary } from '../../services/dashboardService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';

interface QuickInsightsProps {
  data: TransactionSummary;
  selectedBranch: string;
  branchData?: Array<{
    branch_name: string;
    total_amount: number;
    total_profit: number;
    transaction_count: number;
  }>;
  transactionTrend?: Array<{
    date: string;
    count: number;
  }>;
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const formatCurrency = (value: number) => {
  return `${value.toFixed(2)} ر.ع.`;
};

const formatPercentage = (value: number) => {
  return `${(value * 100).toFixed(2)}%`;
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      className="text-xs"
    >
      {name} ({(percent * 100).toFixed(0)}%)
    </text>
  );
};

const renderLegend = (props: any) => {
  const { payload } = props;
  
  return (
    <div className="mt-4 px-2">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Type</th>
            <th className="text-right py-2">Amount</th>
            <th className="text-right py-2">Percentage</th>
          </tr>
        </thead>
        <tbody>
          {payload.map((entry: any, index: number) => (
            <tr key={`item-${index}`} className="border-b border-gray-100">
              <td className="py-2 flex items-center">
                <span
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="font-medium text-gray-900">
                  {entry.value}
                </span>
              </td>
              <td className="text-right py-2 text-gray-900">
                {formatCurrency(entry.payload.value)}
              </td>
              <td className="text-right py-2 text-gray-600">
                {((entry.payload.value / entry.payload.total) * 100).toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
        <p className="text-sm font-medium">{payload[0].name}</p>
        <p className="text-sm text-gray-600">
          {data.isNegative ? '- ' : ''}{formatCurrency(payload[0].value)}
        </p>
        <p className="text-sm text-gray-600">
          {((payload[0].value / data.total) * 100).toFixed(2)}%
        </p>
      </div>
    );
  }
  return null;
};

export function QuickInsights({ data, selectedBranch, branchData, transactionTrend }: QuickInsightsProps) {
  const { language } = useLanguageStore();
  const t = dashboardTranslations[language];

  // Calculate profit margin
  const profitMargin = data.totalAmount > 0 ? (data.totalProfit / data.totalAmount) : 0;

  // Transform payment methods data for pie chart
  const paymentMethodsData = Object.entries(data.byPaymentMethod)
    .filter(([_, value]) => value.amount > 0)
    .map(([key, value]) => ({
      name: t[key as keyof typeof t] || key,
      value: Number(value.amount.toFixed(2)),
      total: data.totalAmount
    }));

  // Transform transaction types data for pie chart
  const transactionTypesData = Object.entries(data.byTransactionType)
    .filter(([_, value]) => Math.abs(value.amount) > 0)
    .map(([key, value]) => ({
      name: t[key as keyof typeof t] || key,
      value: Number(Math.abs(value.amount).toFixed(2)),
      total: data.totalAmount > 0 ? data.totalAmount : 1,
      isNegative: value.amount < 0
    }));

  return (
    <div className="space-y-6">
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-gray-600 mb-1">{t.totalTransactions}</h3>
          <p className="text-3xl font-bold text-gray-900">{data.transactionCount.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-gray-600 mb-1">{t.totalAmount}</h3>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.totalAmount)}</p>
        </div>
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-6 rounded-xl border border-violet-100 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-gray-600 mb-1">{t.totalProfit}</h3>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(data.totalProfit)}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 p-6 rounded-xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-medium text-gray-600 mb-1">{t.profitMargin}</h3>
          <p className="text-3xl font-bold text-gray-900">{formatPercentage(profitMargin)}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Methods Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">{t.paymentMethods}</h3>
          {paymentMethodsData.length > 0 ? (
            <div className="flex flex-col">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethodsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={120}
                      fill="#8884d8"
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {paymentMethodsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 px-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-start py-2 px-4 font-medium text-gray-600">{t.type}</th>
                      <th className="text-end py-2 px-4 font-medium text-gray-600">{t.amount}</th>
                      <th className="text-end py-2 px-4 font-medium text-gray-600">{t.percentage}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentMethodsData.map((entry, index) => (
                      <tr key={`row-${index}`} className="border-b border-gray-100">
                        <td className="py-2 px-4 flex items-center">
                          <span
                            className="w-3 h-3 rounded-full ml-1 mr-3"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium text-gray-900">
                            {entry.name}
                          </span>
                        </td>
                        <td className="text-end py-2 px-4 text-gray-900 font-medium">
                          {formatCurrency(entry.value)}
                        </td>
                        <td className="text-end py-2 px-4 text-gray-600">
                          {((entry.value / entry.total) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              {t.noDataAvailable}
            </div>
          )}
        </div>

        {/* Transaction Types Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">{t.transactionTypes}</h3>
          {transactionTypesData.length > 0 ? (
            <div className="flex flex-col">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={transactionTypesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={120}
                      fill="#8884d8"
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {transactionTypesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 px-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-start py-2 px-4 font-medium text-gray-600">{t.type}</th>
                      <th className="text-end py-2 px-4 font-medium text-gray-600">{t.amount}</th>
                      <th className="text-end py-2 px-4 font-medium text-gray-600">{t.percentage}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionTypesData.map((entry, index) => (
                      <tr key={`row-${index}`} className="border-b border-gray-100">
                        <td className="py-2 px-4 flex items-center">
                          <span
                            className="w-3 h-3 rounded-full ml-1 mr-3"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium text-gray-900">
                            {entry.name}
                          </span>
                        </td>
                        <td className="text-end py-2 px-4 text-gray-900 font-medium">
                          {entry.isNegative ? '- ' : ''}{formatCurrency(entry.value)}
                        </td>
                        <td className="text-end py-2 px-4 text-gray-600">
                          {((entry.value / entry.total) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              {t.noDataAvailable}
            </div>
          )}
        </div>
      </div>

      {/* Branch Comparison - Only show when all branches are selected and data is available */}
      {selectedBranch === 'all' && branchData && branchData.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">{t.branchComparison}</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={branchData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="branch_name" 
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: '#374151' }}
                />
                <Bar dataKey="total_amount" fill="#4F46E5" name={t.totalAmount} />
                <Bar dataKey="total_profit" fill="#10B981" name={t.totalProfit} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Transaction Count Trend */}
      {transactionTrend && transactionTrend.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            {t.transactionTrend}
            {selectedBranch !== 'all' && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({selectedBranch})
              </span>
            )}
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={transactionTrend}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => value.toLocaleString()}
                  labelFormatter={(label) => new Date(label).toLocaleDateString(
                    language === 'ar' ? 'ar' : 'en-US',
                    { month: 'short', day: 'numeric' }
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={false}
                  name={t.transactionCount}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
