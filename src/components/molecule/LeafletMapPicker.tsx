'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Search, Loader2, Navigation } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet to avoid SSR issues
let L: typeof import('leaflet') | null = null;

// Initialize Leaflet only on client side
const initializeLeaflet = async () => {
  if (typeof window !== 'undefined' && !L) {
    L = (await import('leaflet')).default;
    
    // Fix for default markers in Leaflet
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
  }
  return L;
};

interface LeafletMapPickerProps {
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  initialLat?: number;
  initialLng?: number;
  height?: string;
}

interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

const LeafletMapPicker: React.FC<LeafletMapPickerProps> = ({
  onLocationSelect,
  initialLat = 28.6139, // Default to Delhi
  initialLng = 77.2090,
  height = '400px'
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const initMap = async () => {
      try {
        const leaflet = await initializeLeaflet();
        if (!leaflet || !mapRef.current) return;

        // Create map instance
        const map = leaflet.map(mapRef.current).setView([initialLat, initialLng], 15);

        // Add OpenStreetMap tiles
        leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map);

        // Create initial marker
        const marker = leaflet.marker([initialLat, initialLng], {
          draggable: true
        }).addTo(map);

        // Handle marker drag
        marker.on('dragend', () => {
          const position = marker.getLatLng();
          reverseGeocode(position.lat, position.lng);
        });

        // Handle map click
        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          reverseGeocode(lat, lng);
        });

        mapInstance.current = map;
        markerRef.current = marker;
        setLoading(false);

        // Initial reverse geocode
        reverseGeocode(initialLat, initialLng);

      } catch (error) {
        console.error('Error initializing map:', error);
        setLoading(false);
      }
    };

    initMap();

    // Cleanup
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [initialLat, initialLng]);

  // Reverse geocoding function
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        onLocationSelect(lat, lng, data.display_name);
      } else {
        onLocationSelect(lat, lng);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      onLocationSelect(lat, lng);
    }
  };

  // Search for places
  const searchPlaces = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=in`
      );
      const data: NominatimResult[] = await response.json();
      setSearchResults(data);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchPlaces(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  // Handle search result selection
  const handleResultSelect = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    if (mapInstance.current && markerRef.current) {
      mapInstance.current.setView([lat, lng], 16);
      markerRef.current.setLatLng([lat, lng]);
      onLocationSelect(lat, lng, result.display_name);
    }
    
    setSearchValue(result.display_name);
    setShowResults(false);
  };

  // Get current location
  const getCurrentLocation = () => {
    setSearchLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          if (mapInstance.current && markerRef.current) {
            mapInstance.current.setView([lat, lng], 16);
            markerRef.current.setLatLng([lat, lng]);
            reverseGeocode(lat, lng);
          }
          setSearchLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setSearchLoading(false);
          alert('Unable to get your current location. Please ensure location permissions are enabled.');
        }
      );
    } else {
      setSearchLoading(false);
      alert('Geolocation is not supported by this browser.');
    }
  };

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => searchResults.length > 0 && setShowResults(true)}
          className="w-full pl-10 pr-20 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Search for a location in India..."
        />
        <button
          onClick={getCurrentLocation}
          disabled={searchLoading}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-600 hover:text-blue-700 disabled:opacity-50"
          title="Use current location"
        >
          {searchLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
        </button>

        {/* Search Results Dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {searchResults.map((result) => (
              <button
                key={result.place_id}
                onClick={() => handleResultSelect(result)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 line-clamp-1">
                      {result.display_name}
                    </p>
                    {result.address && (
                      <p className="text-xs text-gray-500 mt-1">
                        {[result.address.city, result.address.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="relative border border-gray-300 rounded-lg overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Loading map...</p>
            </div>
          </div>
        )}
        <div
          ref={mapRef}
          style={{ height }}
          className="w-full"
        />
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs text-gray-600">
          Click on the map or drag the marker to select location
        </div>
      </div>

      {/* Map Attribution */}
      <div className="text-xs text-gray-500 text-center">
        Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenStreetMap</a> contributors
      </div>
    </div>
  );
};

export default LeafletMapPicker;