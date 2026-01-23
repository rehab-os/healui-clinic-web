'use client';

import React from 'react';
import { MapPin, Home, Building2, Navigation } from 'lucide-react';

export interface AddressData {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

interface AddressFieldsProps {
  value?: string | AddressData;
  onChange: (address: AddressData) => void;
  required?: boolean;
  className?: string;
}

const AddressFields: React.FC<AddressFieldsProps> = ({ 
  value, 
  onChange, 
  required = false, 
  className = '' 
}) => {
  
  // Parse address from string or object format
  const parseAddress = (address?: string | AddressData): AddressData => {
    if (!address) {
      return { country: 'India' };
    }
    
    if (typeof address === 'string') {
      // Legacy string address - put it in line1
      return { line1: address, country: 'India' };
    }
    
    return { country: 'India', ...address };
  };

  const addressData = parseAddress(value);

  const updateField = (field: keyof AddressData, fieldValue: string) => {
    const updatedAddress = {
      ...addressData,
      [field]: fieldValue.trim() || undefined
    };
    
    // Clean up undefined values
    Object.keys(updatedAddress).forEach(key => {
      if (updatedAddress[key as keyof AddressData] === undefined) {
        delete updatedAddress[key as keyof AddressData];
      }
    });
    
    onChange(updatedAddress);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center mb-3">
        <MapPin className="h-5 w-5 mr-2 text-brand-teal" />
        <h4 className="font-medium text-gray-900">
          Address {required && <span className="text-red-500">*</span>}
        </h4>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Street Address Line 1 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Home className="h-4 w-4 inline mr-1" />
            Street Address {required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            value={addressData.line1 || ''}
            onChange={(e) => updateField('line1', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all duration-200"
            placeholder="House/Flat number, Street name"
            required={required}
          />
        </div>

        {/* Street Address Line 2 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Building2 className="h-4 w-4 inline mr-1" />
            Apartment/Unit (Optional)
          </label>
          <input
            type="text"
            value={addressData.line2 || ''}
            onChange={(e) => updateField('line2', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all duration-200"
            placeholder="Apartment, suite, unit, building, floor"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* City */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              City {required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={addressData.city || ''}
              onChange={(e) => updateField('city', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all duration-200"
              placeholder="Mumbai"
              required={required}
            />
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              State {required && <span className="text-red-500">*</span>}
            </label>
            <select
              value={addressData.state || ''}
              onChange={(e) => updateField('state', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all duration-200"
              required={required}
            >
              <option value="">Select State</option>
              <option value="Andhra Pradesh">Andhra Pradesh</option>
              <option value="Arunachal Pradesh">Arunachal Pradesh</option>
              <option value="Assam">Assam</option>
              <option value="Bihar">Bihar</option>
              <option value="Chhattisgarh">Chhattisgarh</option>
              <option value="Goa">Goa</option>
              <option value="Gujarat">Gujarat</option>
              <option value="Haryana">Haryana</option>
              <option value="Himachal Pradesh">Himachal Pradesh</option>
              <option value="Jharkhand">Jharkhand</option>
              <option value="Karnataka">Karnataka</option>
              <option value="Kerala">Kerala</option>
              <option value="Madhya Pradesh">Madhya Pradesh</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Manipur">Manipur</option>
              <option value="Meghalaya">Meghalaya</option>
              <option value="Mizoram">Mizoram</option>
              <option value="Nagaland">Nagaland</option>
              <option value="Odisha">Odisha</option>
              <option value="Punjab">Punjab</option>
              <option value="Rajasthan">Rajasthan</option>
              <option value="Sikkim">Sikkim</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Telangana">Telangana</option>
              <option value="Tripura">Tripura</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Uttarakhand">Uttarakhand</option>
              <option value="West Bengal">West Bengal</option>
              {/* Union Territories */}
              <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
              <option value="Chandigarh">Chandigarh</option>
              <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
              <option value="Delhi">Delhi</option>
              <option value="Jammu and Kashmir">Jammu and Kashmir</option>
              <option value="Ladakh">Ladakh</option>
              <option value="Lakshadweep">Lakshadweep</option>
              <option value="Puducherry">Puducherry</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Postal Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Navigation className="h-4 w-4 inline mr-1" />
              Postal Code {required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={addressData.postal_code || ''}
              onChange={(e) => updateField('postal_code', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all duration-200"
              placeholder="400001"
              pattern="[0-9]{6}"
              maxLength={6}
              required={required}
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Country
            </label>
            <input
              type="text"
              value={addressData.country || 'India'}
              onChange={(e) => updateField('country', e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal transition-all duration-200 bg-gray-50"
              readOnly
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressFields;