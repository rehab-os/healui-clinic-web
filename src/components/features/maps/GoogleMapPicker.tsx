'use client';

import React, { useCallback, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import { Search, Loader2, Navigation } from 'lucide-react';

const LIBRARIES: ('places')[] = ['places'];

interface GoogleMapPickerProps {
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  initialLat?: number;
  initialLng?: number;
  height?: string;
}

const GoogleMapPicker: React.FC<GoogleMapPickerProps> = ({
  onLocationSelect,
  initialLat = 28.6139,
  initialLng = 77.2090,
  height = '400px'
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: LIBRARIES
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [markerPos, setMarkerPos] = useState({ lat: initialLat, lng: initialLng });
  const [locating, setLocating] = useState(false);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    // Initial reverse geocode
    reverseGeocode(initialLat, initialLng);
  }, [initialLat, initialLng]);

  const reverseGeocode = useCallback((lat: number, lng: number) => {
    if (!window.google) return;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        onLocationSelect(lat, lng, results[0].formatted_address);
      } else {
        onLocationSelect(lat, lng);
      }
    });
  }, [onLocationSelect]);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPos({ lat, lng });
    reverseGeocode(lat, lng);
  }, [reverseGeocode]);

  const handleMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPos({ lat, lng });
    reverseGeocode(lat, lng);
  }, [reverseGeocode]);

  const onAutocompleteLoad = useCallback((ac: google.maps.places.Autocomplete) => {
    autocompleteRef.current = ac;
  }, []);

  const onPlaceChanged = useCallback(() => {
    const ac = autocompleteRef.current;
    if (!ac) return;
    const place = ac.getPlace();
    if (place.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setMarkerPos({ lat, lng });
      mapRef.current?.panTo({ lat, lng });
      mapRef.current?.setZoom(16);
      onLocationSelect(lat, lng, place.formatted_address);
    }
  }, [onLocationSelect]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMarkerPos({ lat, lng });
        mapRef.current?.panTo({ lat, lng });
        mapRef.current?.setZoom(16);
        reverseGeocode(lat, lng);
        setLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocating(false);
        alert('Unable to get your current location. Please ensure location permissions are enabled.');
      }
    );
  };

  if (loadError) {
    return (
      <div className="border border-red-200 rounded-lg p-6 bg-red-50 text-center">
        <p className="text-sm text-red-600">Failed to load Google Maps. Please check your API key.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="border border-gray-200 rounded-lg flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-teal mx-auto mb-2" />
          <p className="text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search Bar with Places Autocomplete */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <Autocomplete
          onLoad={onAutocompleteLoad}
          onPlaceChanged={onPlaceChanged}
          options={{
            componentRestrictions: { country: 'in' },
            types: ['geocode', 'establishment']
          }}
        >
          <input
            type="text"
            className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal text-sm"
            placeholder="Search area, landmark, or pincode..."
          />
        </Autocomplete>
        <button
          onClick={getCurrentLocation}
          disabled={locating}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-teal hover:text-teal-700 disabled:opacity-50 z-10"
          title="Use current location"
        >
          {locating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Map Container */}
      <div className="relative border border-gray-200 rounded-lg overflow-hidden">
        <GoogleMap
          mapContainerStyle={{ width: '100%', height }}
          center={markerPos}
          zoom={15}
          onLoad={onMapLoad}
          onClick={handleMapClick}
          options={{
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
            zoomControl: true,
            gestureHandling: 'greedy'
          }}
        >
          <Marker
            position={markerPos}
            draggable
            onDragEnd={handleMarkerDragEnd}
          />
        </GoogleMap>
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-xs text-gray-600 shadow-sm">
          Search above or click on map to select location
        </div>
      </div>
    </div>
  );
};

export default GoogleMapPicker;
