'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface ConditionData {
  conditionName: string;
  bodyRegion: string;
  count: number;
  percentage: number;
}

interface TopConditionsChartProps {
  data: ConditionData[];
  loading?: boolean;
  maxItems?: number;
}

const COLORS = ['#00897B', '#26A69A', '#4DB6AC', '#80CBC4', '#B2DFDB'];

export default function TopConditionsChart({
  data,
  loading = false,
  maxItems = 5,
}: TopConditionsChartProps) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[90, 75, 60, 45, 30].map((w, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-24 h-4 bg-gray-200 rounded"></div>
            <div className="flex-1 h-6 bg-gray-200 rounded" style={{ width: `${w}%` }}></div>
            <div className="w-12 h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No condition data available
      </div>
    );
  }

  const chartData = data.slice(0, maxItems).map((d) => ({
    ...d,
    shortName: d.conditionName.length > 20 ? d.conditionName.slice(0, 18) + '...' : d.conditionName,
  }));

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="shortName"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#374151' }}
          width={95}
        />
        <Tooltip
          formatter={(value: number, name: string, props: any) => [
            `${value} patients (${props.payload.percentage}%)`,
            props.payload.bodyRegion,
          ]}
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
