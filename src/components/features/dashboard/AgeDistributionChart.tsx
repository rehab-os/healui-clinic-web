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

interface AgeData {
  range: string;
  count: number;
  percentage: number;
}

interface AgeDistributionChartProps {
  data: AgeData[];
  loading?: boolean;
}

const COLORS = ['#E0F2F1', '#80CBC4', '#4DB6AC', '#26A69A', '#00897B'];

export default function AgeDistributionChart({
  data,
  loading = false,
}: AgeDistributionChartProps) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[70, 90, 60, 40, 25].map((w, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-12 h-4 bg-gray-200 rounded"></div>
            <div className="flex-1 h-6 bg-gray-200 rounded" style={{ width: `${w}%` }}></div>
            <div className="w-8 h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No age data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="range"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: '#6B7280' }}
          width={50}
        />
        <Tooltip
          formatter={(value: number, name: string, props: any) => [
            `${value} patients (${props.payload.percentage}%)`,
            'Count',
          ]}
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
