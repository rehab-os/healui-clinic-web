'use client';

import React from 'react';

interface PeakHourData {
  day: string;
  hour: number;
  appointmentCount: number;
}

interface PeakHoursHeatmapProps {
  data: PeakHourData[];
  loading?: boolean;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = [9, 10, 11, 12, 14, 15, 16, 17, 18];

export default function PeakHoursHeatmap({ data, loading = false }: PeakHoursHeatmapProps) {
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-7 gap-1">
          <div className="w-8"></div>
          {DAYS.map((d) => (
            <div key={d} className="h-6 bg-gray-200 rounded"></div>
          ))}
          {HOURS.map((h) => (
            <React.Fragment key={h}>
              <div className="h-8 bg-gray-200 rounded"></div>
              {DAYS.map((d) => (
                <div key={`${h}-${d}`} className="h-8 bg-gray-200 rounded"></div>
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  // Build a lookup map for quick access
  const dataMap: Record<string, number> = {};
  let maxCount = 0;

  data.forEach((d) => {
    const key = `${d.day}-${d.hour}`;
    dataMap[key] = d.appointmentCount;
    if (d.appointmentCount > maxCount) maxCount = d.appointmentCount;
  });

  const getColor = (count: number): string => {
    if (count === 0 || maxCount === 0) return 'bg-gray-100';
    const intensity = count / maxCount;
    if (intensity > 0.75) return 'bg-brand-teal';
    if (intensity > 0.5) return 'bg-brand-teal/70';
    if (intensity > 0.25) return 'bg-brand-teal/40';
    return 'bg-brand-teal/20';
  };

  const formatHour = (hour: number): string => {
    if (hour < 12) return `${hour}AM`;
    if (hour === 12) return '12PM';
    return `${hour - 12}PM`;
  };

  return (
    <div>
      {/* Header */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        <div className="w-10"></div>
        {DAYS.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="space-y-1">
        {HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-7 gap-1">
            <div className="w-10 text-right pr-2 text-xs text-gray-400 leading-6">
              {formatHour(hour)}
            </div>
            {DAYS.map((day) => {
              const count = dataMap[`${day}-${hour}`] || 0;
              return (
                <div
                  key={`${day}-${hour}`}
                  className={`h-6 rounded ${getColor(count)} flex items-center justify-center cursor-default transition-colors hover:ring-2 hover:ring-brand-teal/50`}
                  title={`${day} ${formatHour(hour)}: ${count} appointments`}
                >
                  {count > 0 && (
                    <span className={`text-xs font-medium ${count / maxCount > 0.5 ? 'text-white' : 'text-gray-600'}`}>
                      {count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4">
        <span className="text-xs text-gray-400">Less</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded bg-gray-100"></div>
          <div className="w-4 h-4 rounded bg-brand-teal/20"></div>
          <div className="w-4 h-4 rounded bg-brand-teal/40"></div>
          <div className="w-4 h-4 rounded bg-brand-teal/70"></div>
          <div className="w-4 h-4 rounded bg-brand-teal"></div>
        </div>
        <span className="text-xs text-gray-400">More</span>
      </div>
    </div>
  );
}
