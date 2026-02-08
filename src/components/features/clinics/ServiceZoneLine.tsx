'use client';

import React from 'react';
import { MapPin } from 'lucide-react';

interface ZoneConfig {
    green: {
        pincodes: string[];
        radius_km: number;
    };
    yellow: {
        pincodes: string[];
        radius_km: number;
        extra_charge: number;
    };
    red: {
        pincodes: string[];
        radius_km: number;
        extra_charge: number;
    };
}

interface ServiceZoneLineProps {
    zones: ZoneConfig;
    currentDistance?: number;
    currentZone?: 'green' | 'yellow' | 'red';
    interactive?: boolean;
    className?: string;
}

export default function ServiceZoneLine({
    zones,
    currentDistance,
    currentZone,
    interactive = false,
    className = ''
}: ServiceZoneLineProps) {
    // Sort zones by radius for proper calculation
    const sortedZones = [
        { type: 'green' as const, ...zones.green },
        { type: 'yellow' as const, ...zones.yellow },
        { type: 'red' as const, ...zones.red }
    ].sort((a, b) => a.radius_km - b.radius_km);

    const maxDistance = sortedZones[sortedZones.length - 1].radius_km;
    
    // Calculate zone segments properly (each zone starts from previous zone's end)
    const calculateZoneSegments = () => {
        let previousEnd = 0;
        return sortedZones.map(zone => {
            const start = previousEnd;
            const end = zone.radius_km;
            const width = ((end - start) / maxDistance) * 100;
            previousEnd = end;
            return {
                type: zone.type,
                radius_km: zone.radius_km,
                extra_charge: 'extra_charge' in zone ? zone.extra_charge : 0,
                pincodes: zone.pincodes,
                startPercent: (start / maxDistance) * 100,
                widthPercent: width
            };
        });
    };

    const zoneSegments = calculateZoneSegments();
    const currentPercentage = currentDistance ? Math.min((currentDistance / maxDistance) * 100, 100) : null;

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Compact Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-600" />
                    <span className="text-sm font-semibold text-gray-900">Service Zones</span>
                </div>
                <span className="text-xs text-gray-500">Max: {maxDistance}km</span>
            </div>
            
            {/* Sleek Zone Line */}
            <div className="relative">
                <div className="relative h-6 sm:h-8 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                    {zoneSegments.map((segment) => (
                        <div
                            key={segment.type}
                            className={`absolute top-0 h-full transition-all duration-300 ${
                                segment.type === 'green' ? 'bg-gradient-to-r from-green-400 to-green-500' :
                                segment.type === 'yellow' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                                'bg-gradient-to-r from-red-400 to-red-500'
                            }`}
                            style={{
                                left: `${segment.startPercent}%`,
                                width: `${segment.widthPercent}%`
                            }}
                        >
                            {/* Zone boundary markers */}
                            <div className="absolute right-0 top-0 h-full w-px bg-white bg-opacity-30"></div>
                        </div>
                    ))}
                    
                    {/* Current Position Indicator */}
                    {currentPercentage !== null && (
                        <div 
                            className="absolute top-0 h-full flex items-center transition-all duration-300"
                            style={{ left: `${currentPercentage}%` }}
                        >
                            <div className="w-0.5 h-full bg-gray-900"></div>
                            <div className="absolute -top-1 -left-2 w-4 h-4 bg-gray-900 rounded-full border-2 border-white shadow-lg"></div>
                        </div>
                    )}
                </div>
                
                {/* Distance Labels */}
                <div className="flex justify-between items-center mt-1 px-1">
                    <span className="text-xs font-medium text-gray-600">0km</span>
                    {zoneSegments.map((segment) => (
                        <div key={segment.type} className="text-xs text-center">
                            <span className={`font-semibold ${
                                segment.type === 'green' ? 'text-green-600' :
                                segment.type === 'yellow' ? 'text-yellow-600' :
                                'text-red-600'
                            }`}>
                                {segment.radius_km}km
                            </span>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Mobile: Stacked Zone Info, Desktop: Grid */}
            <div className="space-y-2 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-2">
                {zoneSegments.map((segment) => (
                    <div 
                        key={segment.type}
                        className={`p-3 sm:p-2 rounded-lg border transition-all ${
                            currentZone === segment.type 
                                ? `border-${segment.type}-400 bg-${segment.type}-50 ring-1 ring-${segment.type}-200` 
                                : `border-${segment.type}-200 bg-${segment.type}-25 hover:bg-${segment.type}-50`
                        }`}
                    >
                        <div className="flex items-center justify-between sm:flex-col sm:items-start sm:space-y-1">
                            <div className="flex items-center space-x-2 sm:space-x-1.5 sm:mb-1">
                                <div className={`w-3 h-3 sm:w-2.5 sm:h-2.5 rounded-full ${
                                    segment.type === 'green' ? 'bg-green-500' :
                                    segment.type === 'yellow' ? 'bg-yellow-500' :
                                    'bg-red-500'
                                }`}></div>
                                <span className={`text-sm sm:text-xs font-semibold capitalize ${
                                    segment.type === 'green' ? 'text-green-800' :
                                    segment.type === 'yellow' ? 'text-yellow-800' :
                                    'text-red-800'
                                }`}>
                                    {segment.type} Zone
                                </span>
                            </div>
                            <div className={`text-right sm:text-left text-sm sm:text-xs ${
                                segment.type === 'green' ? 'text-green-700' :
                                segment.type === 'yellow' ? 'text-yellow-700' :
                                'text-red-700'
                            }`}>
                                <div className="font-medium">Up to {segment.radius_km}km</div>
                                <div className="font-semibold">
                                    {segment.extra_charge > 0 ? `+₹${segment.extra_charge}` : 'No charge'}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Current Status - Only show when relevant */}
            {currentZone && currentDistance && (
                <div className={`px-3 py-2 rounded-lg ${
                    currentZone === 'green' ? 'bg-green-50 border border-green-200' :
                    currentZone === 'yellow' ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-red-50 border border-red-200'
                }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-1 sm:space-y-0">
                        <span className={`text-sm font-medium ${
                            currentZone === 'green' ? 'text-green-800' :
                            currentZone === 'yellow' ? 'text-yellow-800' :
                            'text-red-800'
                        }`}>
                            {currentDistance}km • {currentZone.charAt(0).toUpperCase() + currentZone.slice(1)} Zone
                        </span>
                        {currentZone !== 'green' && (
                            <span className={`text-sm font-bold ${
                                currentZone === 'yellow' ? 'text-yellow-800' : 'text-red-800'
                            }`}>
                                +₹{zones[currentZone].extra_charge}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}