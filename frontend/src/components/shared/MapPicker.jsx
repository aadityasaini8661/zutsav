import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Loader } from 'lucide-react';

// Leaflet is loaded dynamically to avoid SSR issues and to inject CSS
let L = null;
let leafletLoaded = false;
let leafletCallbacks = [];

const loadLeaflet = () => {
  if (leafletLoaded) return Promise.resolve();
  return new Promise((resolve) => {
    leafletCallbacks.push(resolve);
    if (leafletCallbacks.length > 1) return; // already loading

    // Inject Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id   = 'leaflet-css';
      link.rel  = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    import('leaflet').then((mod) => {
      L = mod.default;
      // Fix default marker icon paths broken by bundlers
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
      leafletLoaded = true;
      leafletCallbacks.forEach((cb) => cb());
      leafletCallbacks = [];
    });
  });
};

/**
 * MapPicker — Leaflet-based OpenStreetMap with a draggable pin.
 *
 * Props:
 *   lat, lng            — initial coordinates (default: India center)
 *   onPinMove(lat, lng, address) — called when pin is dragged
 *   height              — CSS height string (default: '360px')
 *   readOnly            — disable dragging
 */
export default function MapPicker({ lat = 20.5937, lng = 78.9629, onPinMove, height = '360px', readOnly = false }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markerRef    = useRef(null);
  const [ready, setReady]     = useState(false);
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    loadLeaflet().then(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready || !containerRef.current) return;
    if (mapRef.current) return; // already initialised

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom:   13,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([lat, lng], { draggable: !readOnly }).addTo(map);

    if (!readOnly) {
      marker.on('dragend', async () => {
        const pos = marker.getLatLng();
        const address = await reverseGeocode(pos.lat, pos.lng);
        onPinMove && onPinMove(pos.lat, pos.lng, address);
      });

      map.on('click', async (e) => {
        marker.setLatLng(e.latlng);
        const address = await reverseGeocode(e.latlng.lat, e.latlng.lng);
        onPinMove && onPinMove(e.latlng.lat, e.latlng.lng, address);
      });
    }

    mapRef.current    = map;
    markerRef.current = marker;
  }, [ready]);

  // Update marker position when lat/lng props change externally (e.g. pincode lookup)
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    if (!lat || !lng) return;
    const pos = [lat, lng];
    markerRef.current.setLatLng(pos);
    mapRef.current.setView(pos, 15);
  }, [lat, lng]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current    = null;
        markerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ height }}>
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <Loader size={24} className="animate-spin text-saffron-500" />
        </div>
      )}
      <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
      {!readOnly && ready && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm text-xs text-gray-600 px-3 py-1 rounded-full shadow flex items-center gap-1 z-[1000] pointer-events-none">
          <MapPin size={11} className="text-saffron-500" /> Click map or drag pin to set location
        </div>
      )}
    </div>
  );
}

async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await res.json();
    return data.display_name || '';
  } catch {
    return '';
  }
}
