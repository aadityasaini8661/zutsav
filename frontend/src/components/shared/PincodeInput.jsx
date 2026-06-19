import React, { useState, useEffect } from 'react';
import { MapPin, Loader } from 'lucide-react';
import axios from 'axios';

/**
 * Pincode input with auto-fill for state, city, district.
 * Uses free Indian postal PIN code API.
 *
 * Props:
 *   value       – current pincode string
 *   onChange    – (pincode) => void
 *   onFill      – ({ state, city, district }) => void
 *   error       – string | null
 */
export default function PincodeInput({ value, onChange, onFill, error }) {
  const [loading, setLoading] = useState(false);
  const [info, setInfo]       = useState(null);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (value?.length === 6) {
      fetchPincodeData(value);
    } else {
      setInfo(null);
      setApiError('');
    }
  }, [value]);

  const fetchPincodeData = async (pin) => {
    setLoading(true);
    setApiError('');
    try {
      const res = await axios.get(`https://api.postalpincode.in/pincode/${pin}`);
      const data = res.data[0];
      if (data.Status === 'Success' && data.PostOffice?.length > 0) {
        const po = data.PostOffice[0];
        const filled = {
          state:    po.State,
          city:     po.Division || po.Block || po.Name,
          district: po.District,
        };
        setInfo(filled);
        onFill && onFill(filled);
      } else {
        setApiError('Invalid pincode. Please check and try again.');
        setInfo(null);
        onFill && onFill({ state: '', city: '', district: '' });
      }
    } catch {
      setApiError('Could not fetch location data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="relative">
        <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-saffron-400" />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
            onChange(val);
          }}
          placeholder="Enter 6-digit pincode"
          maxLength={6}
          className={`input pl-9 ${error || apiError ? 'border-red-400 focus:ring-red-300' : ''}`}
        />
        {loading && (
          <Loader size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-saffron-500 animate-spin" />
        )}
      </div>

      {(error || apiError) && (
        <p className="text-red-500 text-xs mt-1">{error || apiError}</p>
      )}

      {info && (
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            { label: 'District', value: info.district },
            { label: 'City',     value: info.city },
            { label: 'State',    value: info.state },
          ].map(({ label, value: val }) => val ? (
            <span key={label} className="bg-saffron-50 text-saffron-700 text-xs px-2 py-0.5 rounded-full border border-saffron-200">
              {label}: {val}
            </span>
          ) : null)}
        </div>
      )}
    </div>
  );
}
