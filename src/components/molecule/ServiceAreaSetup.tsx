'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, X, Target, AlertCircle, DollarSign } from 'lucide-react';
import LeafletMapPicker from './LeafletMapPicker';
import ApiManager from '../../services/api';
import { cn } from '../../lib/utils';

// New coordinate-based service area structure
interface CoordinateZoneConfig {
  green_radius_km: number;        // e.g., 5 km - no travel charge
  yellow_radius_km: number;       // e.g., 15 km  
  red_radius_km: number;          // e.g., 25 km
  yellow_travel_charge: number;   // travel charge for yellow zone
  red_travel_charge: number;      // travel charge for red zone
}

interface ServiceAreaData {
  name: string;
  latitude: number;
  longitude: number;
  base_address?: string;
  zone_config: CoordinateZoneConfig;
}

interface ServiceAreaSetupProps {
  initialData?: Partial<ServiceAreaData>;
  onSave: (data: ServiceAreaData) => void;
  onCancel?: () => void;
  loading?: boolean;
}

export default function ServiceAreaSetup({
  initialData,
  onSave,
  onCancel,
  loading = false
}: ServiceAreaSetupProps) {
  // Form state
  const [name, setName] = useState(initialData?.name || '');
  const [latitude, setLatitude] = useState(initialData?.latitude || 28.6139);
  const [longitude, setLongitude] = useState(initialData?.longitude || 77.2090);
  const [baseAddress, setBaseAddress] = useState(initialData?.base_address || '');
  
  // Zone configuration state
  const [zoneConfig, setZoneConfig] = useState<CoordinateZoneConfig>(
    initialData?.zone_config || {
      green_radius_km: 5,
      yellow_radius_km: 15,
      red_radius_km: 25,
      yellow_travel_charge: 200,
      red_travel_charge: 500
    }
  );

  // Update state when initialData changes (for edit mode)
  useEffect(() => {
    console.log('ServiceAreaSetup: initialData changed:', initialData);
    if (initialData) {
      setName(initialData.name || '');
      setLatitude(initialData.latitude || 28.6139);
      setLongitude(initialData.longitude || 77.2090);
      setBaseAddress(initialData.base_address || '');
      setZoneConfig(initialData.zone_config || {
        green_radius_km: 5,
        yellow_radius_km: 15,
        red_radius_km: 25,
        yellow_travel_charge: 200,
        red_travel_charge: 500
      });
    }
  }, [initialData]);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle location selection from map
  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    setLatitude(lat);
    setLongitude(lng);
    if (address) {
      setBaseAddress(address);
    }
    // Clear location-related errors
    const newErrors = { ...errors };
    delete newErrors.location;
    setErrors(newErrors);
  };

  // Update zone radius
  const updateZoneRadius = (zone: 'green' | 'yellow' | 'red', radius: number) => {
    if (radius < 1 || radius > 100) return;
    
    const newZoneConfig = {
      ...zoneConfig,
      [`${zone}_radius_km`]: radius
    };
    
    // Auto-adjust other zones to maintain logical order
    if (zone === 'green') {
      if (radius >= newZoneConfig.yellow_radius_km) {
        newZoneConfig.yellow_radius_km = radius + 5;
      }
      if (newZoneConfig.yellow_radius_km >= newZoneConfig.red_radius_km) {
        newZoneConfig.red_radius_km = newZoneConfig.yellow_radius_km + 5;
      }
    } else if (zone === 'yellow') {
      if (radius <= newZoneConfig.green_radius_km) {
        newZoneConfig.green_radius_km = Math.max(1, radius - 5);
      }
      if (radius >= newZoneConfig.red_radius_km) {
        newZoneConfig.red_radius_km = radius + 5;
      }
    } else if (zone === 'red') {
      if (radius <= newZoneConfig.yellow_radius_km) {
        newZoneConfig.yellow_radius_km = Math.max(newZoneConfig.green_radius_km + 1, radius - 5);
      }
    }
    
    setZoneConfig(newZoneConfig);
    
    // Clear validation errors
    const newErrors = { ...errors };
    delete newErrors.zones;
    setErrors(newErrors);
  };

  // Update travel charge
  const updateTravelCharge = (zone: 'yellow' | 'red', charge: number) => {
    if (charge < 0) return;
    
    const newZoneConfig = {
      ...zoneConfig,
      [`${zone}_travel_charge`]: charge
    };
    
    // Ensure yellow charge <= red charge
    if (zone === 'yellow' && charge > newZoneConfig.red_travel_charge) {
      newZoneConfig.red_travel_charge = charge;
    } else if (zone === 'red' && charge < newZoneConfig.yellow_travel_charge) {
      newZoneConfig.yellow_travel_charge = charge;
    }
    
    setZoneConfig(newZoneConfig);
  };


  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Service area name is required';
    }

    if (!baseAddress.trim()) {
      newErrors.location = 'Please select a location on the map';
    }

    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      newErrors.location = 'Invalid location coordinates';
    }

    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      newErrors.location = 'Invalid location coordinates';
    }

    // Validate zone configuration
    if (zoneConfig.green_radius_km >= zoneConfig.yellow_radius_km) {
      newErrors.zones = 'Yellow zone radius must be greater than green zone';
    }
    
    if (zoneConfig.yellow_radius_km >= zoneConfig.red_radius_km) {
      newErrors.zones = 'Red zone radius must be greater than yellow zone';
    }

    if (zoneConfig.yellow_travel_charge > zoneConfig.red_travel_charge) {
      newErrors.zones = 'Red zone travel charge should be greater than or equal to yellow zone';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const data: ServiceAreaData = {
      name: name.trim(),
      latitude: Number(latitude),
      longitude: Number(longitude),
      base_address: baseAddress.trim(),
      zone_config: zoneConfig
    };

    onSave(data);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Service Area Name */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Service Area Name</h2>
          <p className="text-sm text-gray-500 mt-1">Give this service area a memorable name</p>
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            const newErrors = { ...errors };
            delete newErrors.name;
            setErrors(newErrors);
          }}
          placeholder="e.g., Central Delhi, South Mumbai"
          className={cn(
            "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500",
            errors.name && "border-red-300 focus:ring-red-500 focus:border-red-500"
          )}
        />
        {errors.name && (
          <div className="flex items-center space-x-2 text-red-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.name}</span>
          </div>
        )}
      </div>

      {/* Map Location Selection */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Base Location</h2>
          <p className="text-sm text-gray-500 mt-1">Set the center point for your service area coverage</p>
        </div>
        <div className="border border-gray-300 rounded-md overflow-hidden">
          <LeafletMapPicker
            onLocationSelect={handleLocationSelect}
            initialLat={latitude}
            initialLng={longitude}
            height="280px"
          />
        </div>
        {baseAddress && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
            <div className="flex items-start space-x-2">
              <MapPin className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">Selected Location</p>
                <p className="text-sm text-gray-600">{baseAddress}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}
                </p>
              </div>
            </div>
          </div>
        )}
        {errors.location && (
          <div className="flex items-center space-x-2 text-red-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>{errors.location}</span>
          </div>
        )}
      </div>

      {/* Zone Configuration */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Service Zones</h2>
          <p className="text-sm text-gray-500 mt-1">
            Configure distance-based service zones and travel charges
          </p>
        </div>

        {errors.zones && (
          <div className="flex items-start space-x-2 text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Zone Configuration Error</p>
              <p className="text-sm text-red-600">{errors.zones}</p>
            </div>
          </div>
        )}

        {/* Zone Configuration Table */}
        <div className="border border-gray-300 rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Zone</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Radius (km)</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Travel Charge</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Green Zone */}
              <tr>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">Green</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={zoneConfig.green_radius_km}
                    onChange={(e) => updateZoneRadius('green', parseInt(e.target.value) || 1)}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-green-600 font-medium">Free</span>
                </td>
              </tr>
              
              {/* Yellow Zone */}
              <tr>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">Yellow</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={zoneConfig.yellow_radius_km}
                    onChange={(e) => updateZoneRadius('yellow', parseInt(e.target.value) || 1)}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm text-gray-500">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={zoneConfig.yellow_travel_charge}
                      onChange={(e) => updateTravelCharge('yellow', parseInt(e.target.value) || 0)}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </td>
              </tr>
              
              {/* Red Zone */}
              <tr>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-900">Red</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={zoneConfig.red_radius_km}
                    onChange={(e) => updateZoneRadius('red', parseInt(e.target.value) || 1)}
                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm text-gray-500">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={zoneConfig.red_travel_charge}
                      onChange={(e) => updateTravelCharge('red', parseInt(e.target.value) || 0)}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Zone Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Coverage Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">0 - {zoneConfig.green_radius_km} km</span>
              <span className="font-medium text-green-600">Free</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{zoneConfig.green_radius_km} - {zoneConfig.yellow_radius_km} km</span>
              <span className="font-medium text-yellow-600">₹{zoneConfig.yellow_travel_charge}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{zoneConfig.yellow_radius_km} - {zoneConfig.red_radius_km} km</span>
              <span className="font-medium text-red-600">₹{zoneConfig.red_travel_charge}</span>
            </div>
          </div>
        </div>
      </div>


      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 bg-white rounded-md hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={loading || Object.keys(errors).length > 0}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Service Area</span>
          )}
        </button>
      </div>
    </div>
  );
}