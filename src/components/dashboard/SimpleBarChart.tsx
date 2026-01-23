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

interface SimpleBarChartProps {
  data: Array<{ name: string; value: number }>;
  color?: string;
  height?: number;
  formatValue?: (value: number) => string;
  loading?: boolean;
}

export default function SimpleBarChart({
  data,
  color = '#00897B',
  height = 200,
  formatValue = (v) => `₹${v.toLocaleString('en-IN')}`,
  loading = false,
}: SimpleBarChartProps) {
  if (loading) {
    return (
      <div className="animate-pulse" style={{ height }}>
        <div className="flex items-end justify-around h-full gap-2 px-4">
          {[60, 80, 45, 90, 70, 55].map((h, i) => (
            <div
              key={i}
              className="bg-gray-200 rounded-t w-full"
              style={{ height: `${h}%` }}
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center text-gray-400" style={{ height }}>
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: '#6B7280' }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
          width={50}
        />
        <Tooltip
          formatter={(value: number) => [formatValue(value), 'Amount']}
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            fontSize: '12px',
          }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={color} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
