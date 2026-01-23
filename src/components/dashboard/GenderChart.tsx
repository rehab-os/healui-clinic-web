'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';

interface GenderData {
  male: number;
  female: number;
  other: number;
}

interface GenderChartProps {
  data: GenderData;
  loading?: boolean;
}

const COLORS = ['#2196F3', '#E91E63', '#9C27B0'];

export default function GenderChart({ data, loading = false }: GenderChartProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[180px]">
        <div className="w-32 h-32 rounded-full bg-gray-200 animate-pulse"></div>
      </div>
    );
  }

  const total = data.male + data.female + data.other;

  if (total === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No gender data available
      </div>
    );
  }

  const chartData = [
    { name: 'Male', value: data.male, percentage: Math.round((data.male / total) * 100) },
    { name: 'Female', value: data.female, percentage: Math.round((data.female / total) * 100) },
    ...(data.other > 0 ? [{ name: 'Other', value: data.other, percentage: Math.round((data.other / total) * 100) }] : []),
  ];

  return (
    <div className="flex items-center">
      <ResponsiveContainer width="50%" height={180}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-1 space-y-2">
        {chartData.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[index] }}
            ></div>
            <span className="text-sm text-gray-600">{item.name}</span>
            <span className="text-sm font-semibold text-gray-900 ml-auto">
              {item.percentage}%
            </span>
          </div>
        ))}
        <div className="pt-2 border-t border-gray-100 mt-2">
          <span className="text-xs text-gray-500">Total: {total} patients</span>
        </div>
      </div>
    </div>
  );
}
