'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Search, X, MapPin, Plus, Minus } from 'lucide-react';
import LeafletMapPicker from './LeafletMapPicker';
import ServiceZoneLine from './ServiceZoneLine';
import ApiManager from '../../services/api';
import { cn } from '../../lib/utils';

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}

interface PincodeData {
    pincode: string;
    office_name: string;
    district: string;
    state_name: string;
    latitude?: number;
    longitude?: number;
}

interface ZoneAssignment {
    pincode: string;
    zone: 'green' | 'yellow' | 'red';
    office_name?: string;
    district?: string;
    state_name?: string;
}

interface ServiceLocationData {
    location_name: string;
    base_address: string;
    base_pincode: string;
    latitude: number;
    longitude: number;
    service_pincodes: string[];
    zone_config: {
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
    };
}

interface ServiceLocationSetupProps {
    initialData?: Partial<ServiceLocationData>;
    onSave: (data: ServiceLocationData) => void;
    onCancel?: () => void;
    loading?: boolean;
}

export default function ServiceLocationSetup({
    initialData,
    onSave,
    onCancel,
    loading = false
}: ServiceLocationSetupProps) {
    // Form state
    const [locationName, setLocationName] = useState(initialData?.location_name || '');
    const [baseAddress, setBaseAddress] = useState(initialData?.base_address || '');
    const [basePincode, setBasePincode] = useState(initialData?.base_pincode || '');
    const [latitude, setLatitude] = useState(initialData?.latitude || 28.6139);
    const [longitude, setLongitude] = useState(initialData?.longitude || 77.2090);
    
    // Pincode management
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<PincodeData[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [pincodeDetails, setPincodeDetails] = useState<Map<string, PincodeData>>(new Map());
    const [selectedZone, setSelectedZone] = useState<'green' | 'yellow' | 'red'>('green');
    
    // Zone config
    const [servicePincodes, setServicePincodes] = useState<string[]>(initialData?.service_pincodes || []);
    const [zoneConfig, setZoneConfig] = useState(initialData?.zone_config || {
        green: { pincodes: [], radius_km: 5 },
        yellow: { pincodes: [], radius_km: 10, extra_charge: 50 },
        red: { pincodes: [], radius_km: 15, extra_charge: 100 }
    });
    
    const debouncedSearch = useDebounce(searchQuery, 300);

    // Initialize zone assignments from initial data
    useEffect(() => {
        if (initialData?.zone_config && initialData?.service_pincodes) {
            const allPincodes = [...new Set(initialData.service_pincodes)];
            const fetchPincodeDetails = async () => {
                const newDetails = new Map<string, PincodeData>();
                
                for (const pincode of allPincodes) {
                    try {
                        const response = await ApiManager.getPincodeDetails(pincode);
                        if (response.success) {
                            newDetails.set(pincode, response.data);
                        }
                    } catch (error) {
                        console.error(`Failed to fetch details for ${pincode}:`, error);
                    }
                }
                
                setPincodeDetails(newDetails);
            };
            
            fetchPincodeDetails();
        }
    }, [initialData]);

    // Search pincodes
    useEffect(() => {
        if (debouncedSearch && debouncedSearch.length >= 3) {
            searchPincodes();
        } else {
            setSearchResults([]);
        }
    }, [debouncedSearch]);

    const searchPincodes = async () => {
        setSearchLoading(true);
        try {
            const response = await ApiManager.searchPincodes(debouncedSearch, 10);
            if (response.success) {
                setSearchResults(response.data);
            }
        } catch (error) {
            console.error('Failed to search pincodes:', error);
        } finally {
            setSearchLoading(false);
        }
    };

    // Handle location selection from map
    const handleLocationSelect = (lat: number, lng: number, address?: string) => {
        setLatitude(lat);
        setLongitude(lng);
        if (address) {
            setBaseAddress(address);
            
            // Try to extract pincode from address
            const pincodeMatch = address.match(/\b\d{6}\b/);
            if (pincodeMatch) {
                setBasePincode(pincodeMatch[0]);
            }
        }
    };

    // Add pincode to selected zone
    const addPincode = (pincodeData: PincodeData) => {
        if (!servicePincodes.includes(pincodeData.pincode)) {
            const newServicePincodes = [...servicePincodes, pincodeData.pincode];
            const newZoneConfig = { ...zoneConfig };
            newZoneConfig[selectedZone].pincodes.push(pincodeData.pincode);
            
            setServicePincodes(newServicePincodes);
            setZoneConfig(newZoneConfig);
            setPincodeDetails(prev => new Map(prev).set(pincodeData.pincode, pincodeData));
        }
        
        setSearchQuery('');
        setSearchResults([]);
    };

    // Remove pincode from all zones
    const removePincode = (pincode: string) => {
        const newServicePincodes = servicePincodes.filter(p => p !== pincode);
        const newZoneConfig = {
            green: {
                ...zoneConfig.green,
                pincodes: zoneConfig.green.pincodes.filter(p => p !== pincode)
            },
            yellow: {
                ...zoneConfig.yellow,
                pincodes: zoneConfig.yellow.pincodes.filter(p => p !== pincode)
            },
            red: {
                ...zoneConfig.red,
                pincodes: zoneConfig.red.pincodes.filter(p => p !== pincode)
            }
        };
        
        setServicePincodes(newServicePincodes);
        setZoneConfig(newZoneConfig);
    };

    // Change zone for a pincode
    const changeZone = (pincode: string, newZone: 'green' | 'yellow' | 'red') => {
        const newZoneConfig = {
            green: {
                ...zoneConfig.green,
                pincodes: zoneConfig.green.pincodes.filter(p => p !== pincode)
            },
            yellow: {
                ...zoneConfig.yellow,
                pincodes: zoneConfig.yellow.pincodes.filter(p => p !== pincode)
            },
            red: {
                ...zoneConfig.red,
                pincodes: zoneConfig.red.pincodes.filter(p => p !== pincode)
            }
        };
        
        newZoneConfig[newZone].pincodes.push(pincode);
        setZoneConfig(newZoneConfig);
    };

    // Update zone pricing
    const updateZonePricing = (zone: 'yellow' | 'red', charge: number) => {
        const newZoneConfig = {
            ...zoneConfig,
            [zone]: {
                ...zoneConfig[zone],
                extra_charge: charge
            }
        };
        setZoneConfig(newZoneConfig);
    };

    // Update zone radius
    const updateZoneRadius = (zone: 'green' | 'yellow' | 'red', radius: number) => {
        const newZoneConfig = {
            ...zoneConfig,
            [zone]: {
                ...zoneConfig[zone],
                radius_km: radius
            }
        };
        setZoneConfig(newZoneConfig);
    };

    // Get zone assignments for display
    const getZoneAssignments = (): ZoneAssignment[] => {
        const assignments: ZoneAssignment[] = [];
        
        ['green', 'yellow', 'red'].forEach(zone => {
            zoneConfig[zone as keyof typeof zoneConfig].pincodes.forEach(pincode => {
                assignments.push({
                    pincode,
                    zone: zone as 'green' | 'yellow' | 'red',
                    ...pincodeDetails.get(pincode)
                });
            });
        });
        
        return assignments.sort((a, b) => a.pincode.localeCompare(b.pincode));
    };

    // Handle form submission
    const handleSave = () => {
        console.log('=== SAVE BUTTON CLICKED ===');
        console.log('Form Data Check:');
        console.log('- Location Name:', locationName);
        console.log('- Base Address:', baseAddress);
        console.log('- Base Pincode:', basePincode);
        console.log('- Latitude:', latitude);
        console.log('- Longitude:', longitude);
        console.log('- Service Pincodes:', servicePincodes);
        console.log('- Zone Config:', zoneConfig);
        
        if (!locationName.trim()) {
            console.log('❌ Validation failed: Location name is empty');
            alert('Please enter a location name.');
            return;
        }
        
        if (!baseAddress.trim()) {
            console.log('❌ Validation failed: Base address is empty');
            alert('Please select a location on the map.');
            return;
        }
        
        if (servicePincodes.length === 0) {
            console.log('❌ Validation failed: No service pincodes added');
            alert('Please add at least one service pincode.');
            return;
        }

        // Ensure latitude and longitude are valid numbers
        const numLat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
        const numLng = typeof longitude === 'string' ? parseFloat(longitude) : longitude;
        
        if (isNaN(numLat) || numLat < -90 || numLat > 90) {
            console.log('❌ Validation failed: Invalid latitude:', latitude);
            alert('Please select a valid location on the map.');
            return;
        }
        
        if (isNaN(numLng) || numLng < -180 || numLng > 180) {
            console.log('❌ Validation failed: Invalid longitude:', longitude);
            alert('Please select a valid location on the map.');
            return;
        }

        const data: ServiceLocationData = {
            location_name: locationName.trim(),
            base_address: baseAddress.trim(),
            base_pincode: basePincode.trim(),
            latitude: numLat,
            longitude: numLng,
            service_pincodes: servicePincodes,
            zone_config: zoneConfig
        };

        console.log('✅ Validation passed, calling onSave with data:', data);
        onSave(data);
    };

    const zoneAssignments = getZoneAssignments();
    const zoneCounts = {
        green: zoneConfig.green.pincodes.length,
        yellow: zoneConfig.yellow.pincodes.length,
        red: zoneConfig.red.pincodes.length
    };

    return (
        <div className="max-w-4xl mx-auto p-3 sm:p-4 space-y-4 sm:space-y-4">
            {/* Location Name */}
            <div className="space-y-2">
                <div>
                    <h2 className="text-base font-semibold text-gray-900 mb-1">Location Name</h2>
                    <p className="text-gray-600 text-xs">Give this service location a memorable name</p>
                </div>
                <input
                    type="text"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    placeholder="e.g., Downtown Clinic, West Delhi Branch"
                    className="w-full px-3 py-3 sm:py-2 text-sm bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
            </div>

            {/* Map Location Selection */}
            <div className="space-y-2">
                <div>
                    <h2 className="text-base font-semibold text-gray-900 mb-1">Location on Map</h2>
                    <p className="text-gray-600 text-xs">Click on the map or search to set your base location</p>
                </div>
                <LeafletMapPicker
                    onLocationSelect={handleLocationSelect}
                    initialLat={latitude}
                    initialLng={longitude}
                    height="250px"
                />
                {baseAddress && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-start space-x-2">
                            <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-xs font-medium text-blue-900">Selected Location:</p>
                                <p className="text-xs text-blue-700 leading-relaxed">{baseAddress}</p>
                                {basePincode && (
                                    <p className="text-xs text-blue-600 mt-0.5">Pincode: {basePincode}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Pincode Management */}
            <div className="space-y-3">
                <div>
                    <h2 className="text-base font-semibold text-gray-900 mb-1">Service Areas</h2>
                    <p className="text-gray-600 text-xs">Add pincodes where you provide physiotherapy services</p>
                </div>

                {/* Zone Selection */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSelectedZone('green')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5",
                            selectedZone === 'green'
                                ? 'bg-green-100 text-green-800 ring-1 ring-green-400'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        )}
                    >
                        <span>Green Zone</span>
                        <span className="px-1.5 py-0.5 bg-white rounded text-xs font-semibold">{zoneCounts.green}</span>
                    </button>
                    <button
                        onClick={() => setSelectedZone('yellow')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5",
                            selectedZone === 'yellow'
                                ? 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-400'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        )}
                    >
                        <span>Yellow Zone</span>
                        <span className="px-1.5 py-0.5 bg-white rounded text-xs font-semibold">{zoneCounts.yellow}</span>
                    </button>
                    <button
                        onClick={() => setSelectedZone('red')}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5",
                            selectedZone === 'red'
                                ? 'bg-red-100 text-red-800 ring-1 ring-red-400'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        )}
                    >
                        <span>Red Zone</span>
                        <span className="px-1.5 py-0.5 bg-white rounded text-xs font-semibold">{zoneCounts.red}</span>
                    </button>
                </div>

                {/* Pincode Search */}
                <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search by pincode, area, or district..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 sm:py-2.5 text-sm bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                    {searchLoading && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        </div>
                    )}
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                        {searchResults.map((result) => (
                            <div
                                key={result.pincode}
                                onClick={() => addPincode(result)}
                                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
                            >
                                <div className="flex-1">
                                    <div className="font-medium text-sm text-gray-900">{result.pincode}</div>
                                    <div className="text-xs text-gray-600">
                                        {result.office_name}, {result.district}, {result.state_name}
                                    </div>
                                </div>
                                <div className={cn(
                                    "px-3 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-1.5",
                                    selectedZone === 'green' && 'bg-green-100 text-green-800',
                                    selectedZone === 'yellow' && 'bg-yellow-100 text-yellow-800',
                                    selectedZone === 'red' && 'bg-red-100 text-red-800'
                                )}>
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>Add to {selectedZone}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Added Pincodes */}
                {zoneAssignments.length > 0 && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-900">
                            Added Pincodes ({servicePincodes.length})
                        </h3>
                        <div className="space-y-1 max-h-64 overflow-y-auto">
                            {zoneAssignments.map(({ pincode, zone, office_name, district, state_name }) => (
                                <div
                                    key={pincode}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex items-center space-x-2 flex-1">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        <div>
                                            <div className="font-medium text-sm text-gray-900">{pincode}</div>
                                            {office_name && (
                                                <div className="text-xs text-gray-600">
                                                    {office_name}, {district}, {state_name}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                        <select
                                            value={zone}
                                            onChange={(e) => changeZone(pincode, e.target.value as 'green' | 'yellow' | 'red')}
                                            className={cn(
                                                'px-2 py-1 rounded text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500',
                                                zone === 'green' && 'bg-green-100 text-green-800',
                                                zone === 'yellow' && 'bg-yellow-100 text-yellow-800',
                                                zone === 'red' && 'bg-red-100 text-red-800'
                                            )}
                                        >
                                            <option value="green">Green</option>
                                            <option value="yellow">Yellow</option>
                                            <option value="red">Red</option>
                                        </select>
                                        
                                        <button
                                            onClick={() => removePincode(pincode)}
                                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Zone Configuration */}
            <div className="space-y-3">
                <div>
                    <h2 className="text-base font-semibold text-gray-900 mb-1">Zone Configuration</h2>
                    <p className="text-gray-600 text-xs">Set distance ranges and pricing for each service zone</p>
                </div>
                
                {/* Zone Visualization */}
                <ServiceZoneLine 
                    zones={zoneConfig}
                    className="mb-3"
                />
                
                {/* Mobile: Stacked, Desktop: Grid Zone Controls */}
                <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-3">
                    {/* Green Zone */}
                    <div className="p-4 sm:p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between sm:flex-col sm:items-start sm:justify-start mb-3 sm:mb-2">
                            <div className="flex items-center space-x-2">
                                <div className="w-7 h-7 sm:w-6 sm:h-6 bg-green-500 rounded-full flex items-center justify-center">
                                    <span className="text-sm sm:text-xs font-bold text-white">G</span>
                                </div>
                                <div>
                                    <div className="text-sm sm:text-xs font-semibold text-green-800">Green Zone</div>
                                    <div className="text-xs text-green-600">{zoneCounts.green} pincodes</div>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:space-y-2 sm:grid-cols-1 sm:gap-0">
                            <div>
                                <label className="block text-sm sm:text-xs font-medium text-green-700 mb-1">Distance (km)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={zoneConfig.green.radius_km}
                                    onChange={(e) => updateZoneRadius('green', parseInt(e.target.value) || 1)}
                                    className="w-full px-3 py-2.5 sm:px-2 sm:py-1.5 text-sm sm:text-xs text-center font-semibold bg-white border border-green-300 rounded focus:outline-none focus:ring-2 sm:focus:ring-1 focus:ring-green-500"
                                />
                            </div>
                            <div className="flex items-end">
                                <div className="w-full px-3 py-2.5 sm:px-2 sm:py-1.5 text-sm sm:text-xs text-center font-semibold bg-green-100 border border-green-200 rounded text-green-800">
                                    Free
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Yellow Zone */}
                    <div className="p-4 sm:p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="flex items-center justify-between sm:flex-col sm:items-start sm:justify-start mb-3 sm:mb-2">
                            <div className="flex items-center space-x-2">
                                <div className="w-7 h-7 sm:w-6 sm:h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                                    <span className="text-sm sm:text-xs font-bold text-white">Y</span>
                                </div>
                                <div>
                                    <div className="text-sm sm:text-xs font-semibold text-yellow-800">Yellow Zone</div>
                                    <div className="text-xs text-yellow-600">{zoneCounts.yellow} pincodes</div>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:space-y-2 sm:grid-cols-1 sm:gap-0">
                            <div>
                                <label className="block text-sm sm:text-xs font-medium text-yellow-700 mb-1">Distance (km)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={zoneConfig.yellow.radius_km}
                                    onChange={(e) => updateZoneRadius('yellow', parseInt(e.target.value) || 1)}
                                    className="w-full px-3 py-2.5 sm:px-2 sm:py-1.5 text-sm sm:text-xs text-center font-semibold bg-white border border-yellow-300 rounded focus:outline-none focus:ring-2 sm:focus:ring-1 focus:ring-yellow-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm sm:text-xs font-medium text-yellow-700 mb-1">Charge (₹)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={zoneConfig.yellow.extra_charge}
                                    onChange={(e) => updateZonePricing('yellow', parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2.5 sm:px-2 sm:py-1.5 text-sm sm:text-xs text-center font-semibold bg-white border border-yellow-300 rounded focus:outline-none focus:ring-2 sm:focus:ring-1 focus:ring-yellow-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Red Zone */}
                    <div className="p-4 sm:p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center justify-between sm:flex-col sm:items-start sm:justify-start mb-3 sm:mb-2">
                            <div className="flex items-center space-x-2">
                                <div className="w-7 h-7 sm:w-6 sm:h-6 bg-red-500 rounded-full flex items-center justify-center">
                                    <span className="text-sm sm:text-xs font-bold text-white">R</span>
                                </div>
                                <div>
                                    <div className="text-sm sm:text-xs font-semibold text-red-800">Red Zone</div>
                                    <div className="text-xs text-red-600">{zoneCounts.red} pincodes</div>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:space-y-2 sm:grid-cols-1 sm:gap-0">
                            <div>
                                <label className="block text-sm sm:text-xs font-medium text-red-700 mb-1">Distance (km)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    value={zoneConfig.red.radius_km}
                                    onChange={(e) => updateZoneRadius('red', parseInt(e.target.value) || 1)}
                                    className="w-full px-3 py-2.5 sm:px-2 sm:py-1.5 text-sm sm:text-xs text-center font-semibold bg-white border border-red-300 rounded focus:outline-none focus:ring-2 sm:focus:ring-1 focus:ring-red-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm sm:text-xs font-medium text-red-700 mb-1">Charge (₹)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={zoneConfig.red.extra_charge}
                                    onChange={(e) => updateZonePricing('red', parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2.5 sm:px-2 sm:py-1.5 text-sm sm:text-xs text-center font-semibold bg-white border border-red-300 rounded focus:outline-none focus:ring-2 sm:focus:ring-1 focus:ring-red-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-3">
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="w-full sm:w-auto px-6 py-3 sm:py-2 text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors order-2 sm:order-1"
                    >
                        Cancel
                    </button>
                )}
                <button
                    onClick={handleSave}
                    disabled={loading || !locationName.trim() || !baseAddress.trim() || servicePincodes.length === 0}
                    className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 order-1 sm:order-2"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Saving...</span>
                        </>
                    ) : (
                        <span>Save Service Location</span>
                    )}
                </button>
            </div>
        </div>
    );
}