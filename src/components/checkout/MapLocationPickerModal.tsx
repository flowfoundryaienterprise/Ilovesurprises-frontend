import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Search,
  Crosshair,
  Check,
  X,
  Navigation,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import L from 'leaflet';

export interface MapAddressResult {
  addressLine1: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  label?: string;
  lat?: number;
  lng?: number;
}

interface MapLocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress: (result: MapAddressResult) => void;
  initialAddress?: Partial<MapAddressResult>;
}

type MapStyleMode = 'normal' | 'satellite';

// Official Google Maps 4-Color Pin Logo Component
export const GoogleMapsLogoPin: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 20 }) => (
  <svg
    width={size}
    height={(size * 120) / 92}
    viewBox="0 0 92 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path d="M46 0C20.595 0 0 20.595 0 46C0 57.5 4.3 68 11.5 76L46 34.5V0Z" fill="#4285F4" />
    <path d="M11.5 76C18.7 84 27.6 93.5 37 107.5C40 112 43 116.5 46 120V34.5L11.5 76Z" fill="#34A853" />
    <path d="M46 0V34.5L80.5 76C87.7 68 92 57.5 92 46C92 20.595 71.405 0 46 0Z" fill="#EA4335" />
    <path d="M46 120C49 116.5 52 112 55 107.5C64.4 93.5 73.3 84 80.5 76L46 34.5V120Z" fill="#FBBC04" />
    <circle cx="46" cy="46" r="18" fill="#EA4335" />
  </svg>
);

// Official Google Maps Red Pin Vector Component
export const GoogleMapsRedPinIcon: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 18 }) => (
  <svg
    width={size}
    height={(size * 512) / 384}
    viewBox="0 0 384 512"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0z"
      fill="#EA4335"
    />
    <circle cx="192" cy="192" r="70" fill="#790000" />
  </svg>
);

export const MapLocationPickerModal: React.FC<MapLocationPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectAddress,
  initialAddress,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Default is Normal Google Maps
  const [mapStyle, setMapStyle] = useState<MapStyleMode>('normal');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: 44.0462,
    lng: -123.022,
  });

  const [selectedAddress, setSelectedAddress] = useState<MapAddressResult>(() => {
    if (initialAddress?.addressLine1) {
      return {
        addressLine1: initialAddress.addressLine1,
        city: initialAddress.city || '',
        state: initialAddress.state || '',
        zipCode: initialAddress.zipCode || '',
        country: initialAddress.country || 'United States',
        label: 'Initial Delivery Location',
      };
    }
    return {
      addressLine1: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
      label: 'Pinned Location',
    };
  });

  // Reverse Geocoding via Nominatim API
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    setCurrentCoords({ lat, lng });

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { 'User-Agent': 'ILoveSurprisesApp/1.0' } }
      );
      if (res.ok) {
        const data = await res.json();
        const a = data.address || {};

        const streetNumber = a.house_number || '';
        const streetName = a.road || a.pedestrian || a.suburb || a.neighbourhood || a.residential || '';
        const fullStreet = [streetNumber, streetName].filter(Boolean).join(' ') || data.name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

        const city = a.city || a.town || a.village || a.municipality || a.county || '';
        const state = a.state || a.province || a.region || '';
        const zipCode = a.postcode || '';
        const country = a.country || 'United States';

        setSelectedAddress({
          addressLine1: fullStreet,
          city,
          state,
          zipCode,
          country,
          label: data.display_name?.split(',').slice(0, 3).join(',') || fullStreet,
          lat,
          lng,
        });
      }
    } catch {
      // Fallback
      setSelectedAddress((prev) => ({
        ...prev,
        lat,
        lng,
        label: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      }));
    } finally {
      setIsReverseGeocoding(false);
    }
  }, []);

  // Authentic Official Google Maps Red Pin DivIcon
  const createGoogleMarkerIcon = () => {
    return L.divIcon({
      className: 'google-map-marker-pin',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%); cursor: grab; user-select: none;">
          <!-- Interactive Google Maps Callout Badge -->
          <div style="background: #202124; color: #ffffff; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; font-family: Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; white-space: nowrap; box-shadow: 0 4px 14px rgba(0,0,0,0.35); margin-bottom: 5px; display: flex; align-items: center; gap: 6px; border: 1px solid rgba(255,255,255,0.2); line-height: 1;">
            <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #34A853; box-shadow: 0 0 6px #34A853;"></span>
            <span>Delivery location</span>
          </div>

          <!-- Tooltip Triangle Pointer -->
          <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 5px solid #202124; margin-top: -5px; margin-bottom: 2px;"></div>

          <!-- Official Google Maps Red Teardrop Pin -->
          <div class="google-map-pin-body" style="position: relative; width: 38px; height: 50px; filter: drop-shadow(0 6px 14px rgba(0,0,0,0.38));">
            <svg width="38" height="50" viewBox="0 0 384 512" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0z"
                fill="#EA4335"
              />
              <circle cx="192" cy="192" r="70" fill="#790000" />
            </svg>
          </div>

          <!-- Ground Contact Shadow -->
          <div class="google-map-pin-shadow" style="width: 18px; height: 5px; background: radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 80%); border-radius: 50%; margin-top: -3px;"></div>
        </div>
      `,
      iconSize: [40, 92],
      iconAnchor: [20, 92],
    });
  };

  // Switch Tile Layer between Normal and Satellite
  const updateTileLayer = (mode: MapStyleMode, map: L.Map) => {
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const url =
      mode === 'normal'
        ? 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
        : 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}';

    const attribution =
      mode === 'normal' ? '&copy; Google Maps' : '&copy; Google Maps Satellite';

    const newLayer = L.tileLayer(url, {
      attribution,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      maxZoom: 21,
    });

    newLayer.addTo(map);
    tileLayerRef.current = newLayer;
  };

  // Initialize Map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    const initialLat = currentCoords.lat;
    const initialLng = currentCoords.lng;

    // Create map
    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    mapInstanceRef.current = map;
    updateTileLayer(mapStyle, map);

    // Create marker
    const pinIcon = createGoogleMarkerIcon();
    const marker = L.marker([initialLat, initialLng], {
      icon: pinIcon,
      draggable: true,
    }).addTo(map);

    markerRef.current = marker;

    // Drag marker event
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      reverseGeocode(pos.lat, pos.lng);
    });

    // Map click event
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    });

    // Invalidate size once modal animation settles
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Update Tile Layer on style toggle
  useEffect(() => {
    if (mapInstanceRef.current) {
      updateTileLayer(mapStyle, mapInstanceRef.current);
    }
  }, [mapStyle]);

  // Search places with debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      const resetTimer = setTimeout(() => {
        setSearchResults([]);
        setIsSearching(false);
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery
          )}&addressdetails=1&limit=5`,
          { headers: { 'User-Agent': 'ILoveSurprisesApp/1.0' } }
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data || []);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Move map to specific coordinates
  const flyToLocation = (lat: number, lng: number, zoom = 17) => {
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], zoom, {
        duration: 1.2,
      });
      markerRef.current.setLatLng([lat, lng]);
      reverseGeocode(lat, lng);
    }
  };

  // User Current Geolocation
  const handleLocateMe = () => {
    setIsLocatingUser(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocatingUser(false);
          flyToLocation(pos.coords.latitude, pos.coords.longitude, 18);
        },
        () => {
          setIsLocatingUser(false);
          flyToLocation(44.0462, -123.022, 17);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      setIsLocatingUser(false);
      flyToLocation(44.0462, -123.022, 17);
    }
  };

  // Select Search Result
  const handleSelectSearchResult = (item: any) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    flyToLocation(lat, lng, 18);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Prevent background body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleConfirm = () => {
    onSelectAddress(selectedAddress);
    onClose();
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="blinkit-map-title"
      onClick={onClose}
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[860px] bg-white rounded-t-[28px] sm:rounded-[28px] border-t sm:border border-[#f0dce7] shadow-[0_24px_80px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col h-[94dvh] sm:h-auto sm:max-h-[88vh] animate-sheet-in sm:animate-in sm:zoom-in-95 duration-200"
      >
        
        {/* 1. Google Maps-Style Clean Header */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-[#f3e5ee] bg-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[11px] bg-white border border-[#eedbe6] shadow-2xs flex items-center justify-center shrink-0">
              <GoogleMapsLogoPin size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="blinkit-map-title" className="text-sm sm:text-base font-black text-[#141219] m-0 tracking-tight leading-tight">
                  Select Delivery Location
                </h2>
                <span className="text-[9px] font-black uppercase text-[#1a73e8] bg-[#e8f0fe] px-2 py-0.5 rounded-full border border-[#c2d7fa]">
                  Google Maps
                </span>
              </div>
              <p className="text-[11px] text-[#716d77] m-0">
                Move the pin to your exact doorstep for quick delivery
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Map"
            className="w-8 h-8 rounded-full bg-[#f8f2f6] hover:bg-[#ffe5ee] text-[#716d77] hover:text-[#D30915] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Google-Style Clean Search Bar & Action Strip */}
        <div className="p-3 sm:p-3.5 bg-[#fdfafc] border-b border-[#f3e5ee] shrink-0">
          <div className="flex flex-col sm:flex-row items-center gap-2 relative">
            {/* Search Input Box */}
            <div className="relative flex-1 w-full">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#D30915]">
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin text-[#1a73e8]" /> : <Search className="w-4 h-4 text-[#716d77]" />}
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for area, street, landmark, apartment..."
                className="w-full h-[40px] pl-10 pr-9 rounded-[13px] bg-white border border-[#e8dfe5] focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/10 text-xs sm:text-sm font-medium text-[#141219] placeholder:text-[#9e97a2] outline-none transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9e97a2] hover:text-[#141219] p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Autocomplete Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-[46px] left-0 right-0 z-40 bg-white rounded-[16px] border border-[#e8dfe5] shadow-[0_16px_36px_rgba(20,18,25,0.18)] overflow-hidden max-h-[200px] overflow-y-auto">
                  {searchResults.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectSearchResult(item)}
                      className="p-3 hover:bg-[#f8faff] border-b border-[#f7eff4] last:border-0 cursor-pointer flex items-center gap-2.5 text-xs text-[#141219] transition-colors"
                    >
                      <GoogleMapsRedPinIcon size={16} className="shrink-0" />
                      <span className="truncate font-medium">{item.display_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Use Current Location GPS Pill */}
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={isLocatingUser}
              className="w-full sm:w-auto h-[40px] px-4 rounded-[13px] bg-white hover:bg-[#e8f0fe] text-[#1a73e8] border border-[#c2d7fa] text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs shrink-0 whitespace-nowrap active:scale-[0.98]"
            >
              {isLocatingUser ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#1a73e8]" />
              ) : (
                <Crosshair className="w-4 h-4 text-[#1a73e8]" />
              )}
              <span>Current Location</span>
            </button>
          </div>
        </div>

        {/* 3. Real Interactive Map Canvas with Floating Overlays */}
        <div className="relative w-full flex-1 min-h-[240px] sm:h-[340px] sm:flex-initial bg-[#ece7eb]">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* 1-Click Toggle Button for Normal View / Satellite View */}
          <button
            type="button"
            onClick={() => setMapStyle((prev) => (prev === 'normal' ? 'satellite' : 'normal'))}
            className="absolute top-3 right-3 z-20 h-[36px] px-3.5 rounded-[12px] bg-white/95 hover:bg-[#fff1f2] text-[#141219] hover:text-[#D30915] backdrop-blur-md border border-[#eedbe6] shadow-[0_4px_16px_rgba(0,0,0,0.14)] text-xs font-black transition-all flex items-center gap-2 cursor-pointer active:scale-95 select-none"
          >
            {mapStyle === 'normal' ? (
              <>
                <span className="text-sm">🛰️</span>
                <span>Satellite View</span>
              </>
            ) : (
              <>
                <span className="text-sm">🗺️</span>
                <span>Normal View</span>
              </>
            )}
          </button>

          {/* Reverse Geocode Loading Status */}
          {isReverseGeocoding && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 px-3.5 py-1.5 rounded-full bg-[#141219]/90 text-white backdrop-blur-md border border-white/20 text-[11px] font-black flex items-center gap-2 shadow-lg animate-in fade-in duration-150">
              <Loader2 className="w-3 h-3 animate-spin text-[#ff3b81]" />
              <span>Fetching doorstep address...</span>
            </div>
          )}

          {/* Hint Overlay (Bottom Left) */}
          <div className="absolute bottom-2.5 left-2.5 z-20 px-2.5 py-1 rounded-[8px] bg-white/90 backdrop-blur-md border border-[#eedbe6] shadow-sm text-[10px] font-bold text-[#55505a] flex items-center gap-1 pointer-events-none">
            <Navigation className="w-3 h-3 text-[#1a73e8]" />
            <span>Click or drag pin anywhere</span>
          </div>

          {/* External Google Maps Button (Bottom Right) */}
          {selectedAddress.lat && selectedAddress.lng && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${selectedAddress.lat},${selectedAddress.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-2.5 right-2.5 z-20 px-2.5 py-1 rounded-[8px] bg-white/95 hover:bg-[#e8f0fe] border border-[#c2d7fa] shadow-sm text-[10px] font-black text-[#1a73e8] flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>Open in Google Maps</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>

        {/* 4. Google-Style Bottom Address & Action Bar */}
        <div className="p-3.5 sm:p-4 border-t border-[#f3e5ee] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-[12px] bg-white border border-[#eedbe6] shadow-2xs flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <GoogleMapsLogoPin size={24} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="inline-block text-[9px] font-black uppercase tracking-wider text-[#1a73e8] bg-[#e8f0fe] px-1.5 py-0.2 rounded border border-[#c2d7fa]">
                  Delivery Address
                </span>
                <span className="text-[10px] font-semibold text-[#8a858f]">
                  Exact Pin Location
                </span>
              </div>
              <strong className="block text-xs sm:text-sm font-black text-[#141219] mt-0.5 truncate">
                {selectedAddress.addressLine1}
              </strong>
              <p className="text-[11px] text-[#716d77] m-0 truncate">
                {selectedAddress.city}, {selectedAddress.state} {selectedAddress.zipCode}, {selectedAddress.country}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial h-[42px] px-4 rounded-[12px] bg-[#f8f2f6] hover:bg-[#ede5eb] text-[#55505a] text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 sm:flex-initial h-[42px] px-6 rounded-[12px] bg-gradient-to-r from-[#D30915] via-[#ff3b81] to-[#B60711] hover:from-[#B60711] hover:to-[#be1d58] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_6px_20px_rgba(211, 9, 21,0.35)] active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Confirm Location & Deliver</span>
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
