import React, { useState, useCallback, useEffect } from 'react';
import { Search, X, MapPin, Plus } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
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

interface PincodeZoneManagerProps {
    servicePincodes: string[];
    zoneConfig: {
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
    onChange: (servicePincodes: string[], zoneConfig: any) => void;
    onPriceChange?: (yellowCharge: number, redCharge: number) => void;
}

export default function PincodeZoneManager({
    servicePincodes,
    zoneConfig,
    onChange,
    onPriceChange
}: PincodeZoneManagerProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<PincodeData[]>([]);
    const [loading, setLoading] = useState(false);
    const [pincodeDetails, setPincodeDetails] = useState<Map<string, PincodeData>>(new Map());
    const [selectedZone, setSelectedZone] = useState<'green' | 'yellow' | 'red'>('green');
    const [yellowCharge, setYellowCharge] = useState(zoneConfig.yellow.extra_charge);
    const [redCharge, setRedCharge] = useState(zoneConfig.red.extra_charge);
    
    const debouncedSearch = useDebounce(searchQuery, 300);

    // Initialize zone assignments
    const getZoneAssignments = (): ZoneAssignment[] => {
        const assignments: ZoneAssignment[] = [];
        
        // Green zone
        zoneConfig.green.pincodes.forEach(pincode => {
            assignments.push({
                pincode,
                zone: 'green',
                ...pincodeDetails.get(pincode)
            });
        });
        
        // Yellow zone
        zoneConfig.yellow.pincodes.forEach(pincode => {
            assignments.push({
                pincode,
                zone: 'yellow',
                ...pincodeDetails.get(pincode)
            });
        });
        
        // Red zone
        zoneConfig.red.pincodes.forEach(pincode => {
            assignments.push({
                pincode,
                zone: 'red',
                ...pincodeDetails.get(pincode)
            });
        });
        
        return assignments.sort((a, b) => a.pincode.localeCompare(b.pincode));
    };

    // Search pincodes
    useEffect(() => {
        if (debouncedSearch && debouncedSearch.length >= 3) {
            searchPincodes();
        } else {
            setSearchResults([]);
        }
    }, [debouncedSearch]);

    const searchPincodes = async () => {
        setLoading(true);
        try {
            const response = await ApiManager.searchPincodes(debouncedSearch, 10);
            if (response.success) {
                setSearchResults(response.data);
            }
        } catch (error) {
            console.error('Failed to search pincodes:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch details for all assigned pincodes
    useEffect(() => {
        const fetchPincodeDetails = async () => {
            const allPincodes = [...new Set(servicePincodes)];
            const newDetails = new Map<string, PincodeData>();
            
            for (const pincode of allPincodes) {
                if (!pincodeDetails.has(pincode)) {
                    try {
                        const response = await ApiManager.getPincodeDetails(pincode);
                        if (response.success) {
                            newDetails.set(pincode, response.data);
                        }
                    } catch (error) {
                        console.error(`Failed to fetch details for ${pincode}:`, error);
                    }
                }
            }
            
            if (newDetails.size > 0) {
                setPincodeDetails(prev => new Map([...prev, ...newDetails]));
            }
        };
        
        fetchPincodeDetails();
    }, [servicePincodes]);

    const addPincode = (pincodeData: PincodeData) => {
        // Add to service pincodes if not already present
        if (!servicePincodes.includes(pincodeData.pincode)) {
            const newServicePincodes = [...servicePincodes, pincodeData.pincode];
            
            // Add to selected zone
            const newZoneConfig = { ...zoneConfig };
            newZoneConfig[selectedZone].pincodes.push(pincodeData.pincode);
            
            // Store pincode details
            setPincodeDetails(prev => new Map(prev).set(pincodeData.pincode, pincodeData));
            
            onChange(newServicePincodes, newZoneConfig);
        }
        
        setSearchQuery('');
        setSearchResults([]);
    };

    const removePincode = (pincode: string) => {
        // Remove from service pincodes
        const newServicePincodes = servicePincodes.filter(p => p !== pincode);
        
        // Remove from all zones
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
        
        onChange(newServicePincodes, newZoneConfig);
    };

    const changeZone = (pincode: string, newZone: 'green' | 'yellow' | 'red') => {
        // Remove from all zones
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
        
        // Add to new zone
        newZoneConfig[newZone].pincodes.push(pincode);
        
        onChange(servicePincodes, newZoneConfig);
    };

    const updatePricing = (zone: 'yellow' | 'red', charge: number) => {
        if (zone === 'yellow') {
            setYellowCharge(charge);
        } else {
            setRedCharge(charge);
        }
        
        const newZoneConfig = {
            ...zoneConfig,
            [zone]: {
                ...zoneConfig[zone],
                extra_charge: charge
            }
        };
        
        onChange(servicePincodes, newZoneConfig);
        onPriceChange?.(
            zone === 'yellow' ? charge : yellowCharge,
            zone === 'red' ? charge : redCharge
        );
    };

    const zoneAssignments = getZoneAssignments();
    const zoneCounts = {
        green: zoneConfig.green.pincodes.length,
        yellow: zoneConfig.yellow.pincodes.length,
        red: zoneConfig.red.pincodes.length
    };

    return (
        <div className="space-y-6">
            {/* Zone Selection & Search */}
            <Card>
                <CardHeader>
                    <CardTitle>Service Area Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Zone Selection Buttons */}
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant={selectedZone === 'green' ? 'default' : 'outline'}
                            onClick={() => setSelectedZone('green')}
                            className={cn(
                                selectedZone === 'green' && 'bg-green-600 hover:bg-green-700'
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <span>Green Zone</span>
                                <Badge variant="secondary">{zoneCounts.green}</Badge>
                            </div>
                        </Button>
                        <Button
                            size="sm"
                            variant={selectedZone === 'yellow' ? 'default' : 'outline'}
                            onClick={() => setSelectedZone('yellow')}
                            className={cn(
                                selectedZone === 'yellow' && 'bg-yellow-600 hover:bg-yellow-700'
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <span>Yellow Zone</span>
                                <Badge variant="secondary">{zoneCounts.yellow}</Badge>
                            </div>
                        </Button>
                        <Button
                            size="sm"
                            variant={selectedZone === 'red' ? 'default' : 'outline'}
                            onClick={() => setSelectedZone('red')}
                            className={cn(
                                selectedZone === 'red' && 'bg-red-600 hover:bg-red-700'
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <span>Red Zone</span>
                                <Badge variant="secondary">{zoneCounts.red}</Badge>
                            </div>
                        </Button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search by pincode, area, or district..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Search Results */}
                    {loading && (
                        <div className="text-sm text-gray-500">Searching...</div>
                    )}
                    
                    {searchResults.length > 0 && (
                        <div className="border rounded-lg max-h-60 overflow-y-auto">
                            {searchResults.map((result) => (
                                <div
                                    key={result.pincode}
                                    className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
                                    onClick={() => addPincode(result)}
                                >
                                    <div className="flex-1">
                                        <div className="font-semibold">{result.pincode}</div>
                                        <div className="text-sm text-gray-500">
                                            {result.office_name}, {result.district}, {result.state_name}
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className={cn(
                                            'ml-2',
                                            selectedZone === 'green' && 'text-green-600',
                                            selectedZone === 'yellow' && 'text-yellow-600',
                                            selectedZone === 'red' && 'text-red-600'
                                        )}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Zone Pricing */}
            <Card>
                <CardHeader>
                    <CardTitle>Zone Pricing</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="text-sm font-medium text-green-600">Green Zone</label>
                        <p className="text-lg font-semibold">No Extra Charge</p>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-yellow-600">Yellow Zone</label>
                        <div className="flex items-center gap-2">
                            <span className="text-sm">₹</span>
                            <Input
                                type="number"
                                value={yellowCharge}
                                onChange={(e) => updatePricing('yellow', parseInt(e.target.value) || 0)}
                                className="w-24"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-red-600">Red Zone</label>
                        <div className="flex items-center gap-2">
                            <span className="text-sm">₹</span>
                            <Input
                                type="number"
                                value={redCharge}
                                onChange={(e) => updatePricing('red', parseInt(e.target.value) || 0)}
                                className="w-24"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* All Pincodes with Zone Assignment */}
            <Card>
                <CardHeader>
                    <CardTitle>Service Areas ({servicePincodes.length} Pincodes)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {zoneAssignments.map(({ pincode, zone, office_name, district, state_name }) => (
                            <div
                                key={pincode}
                                className="flex items-center justify-between p-3 border rounded-lg"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-gray-400" />
                                        <span className="font-semibold">{pincode}</span>
                                    </div>
                                    {office_name && (
                                        <div className="text-sm text-gray-500 ml-6">
                                            {office_name}, {district}, {state_name}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <select
                                        value={zone}
                                        onChange={(e) => changeZone(pincode, e.target.value as 'green' | 'yellow' | 'red')}
                                        className={cn(
                                            'px-3 py-1 rounded-lg border text-sm font-medium',
                                            zone === 'green' && 'bg-green-100 border-green-300 text-green-800',
                                            zone === 'yellow' && 'bg-yellow-100 border-yellow-300 text-yellow-800',
                                            zone === 'red' && 'bg-red-100 border-red-300 text-red-800'
                                        )}
                                    >
                                        <option value="green">Green</option>
                                        <option value="yellow">Yellow</option>
                                        <option value="red">Red</option>
                                    </select>
                                    
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => removePincode(pincode)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}