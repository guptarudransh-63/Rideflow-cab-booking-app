import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { MapPin, Navigation, Car, Users, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

const CATEGORY_META = {
  economy: {
    name: 'RideFlow Eco',
    tagline: 'Affordable, everyday rides',
    capacity: 4,
    icon: '🚗',
  },
  comfort: {
    name: 'RideFlow Comfort',
    tagline: 'Newer cars with extra legroom',
    capacity: 4,
    icon: '✨',
  },
  premium: {
    name: 'RideFlow Black',
    tagline: 'Premium luxury vehicles & chauffeurs',
    capacity: 4,
    icon: '🎩',
  },
  xl: {
    name: 'RideFlow XL',
    tagline: 'Spacious SUVs for groups up to 6',
    capacity: 6,
    icon: '🚙',
  },
};

export const BookingPanel = ({ onRouteCalculated, onRequestRide, isRequesting = false }) => {
  const [pickupQuery, setPickupQuery] = useState('100 Market St, Financial District');
  const [destQuery, setDestQuery] = useState('Pier 39, Beach St & The Embarcadero');
  const [pickup, setPickup] = useState({
    name: 'Downtown Financial Center',
    address: '100 Market St, Financial District',
    coordinates: [-122.399, 37.793],
  });
  const [destination, setDestination] = useState({
    name: 'Fisherman’s Pier & Marina',
    address: 'Pier 39, Beach St & The Embarcadero',
    coordinates: [-122.409, 37.808],
  });

  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [activeInput, setActiveInput] = useState(null); // 'pickup' | 'dest'

  const [routeInfo, setRouteInfo] = useState(null);
  const [estimates, setEstimates] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('economy');
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [error, setError] = useState('');

  // Fetch estimates whenever pickup and destination are set
  const calculateEstimates = async (p = pickup, d = destination) => {
    if (!p?.coordinates || !d?.coordinates) return;
    try {
      setLoadingEstimate(true);
      setError('');
      const res = await api.getEstimate({
        pickup: { address: p.address || p.name, coordinates: p.coordinates },
        destination: { address: d.address || d.name, coordinates: d.coordinates },
      });

      if (res.success) {
        setRouteInfo(res.route);
        setEstimates(res.estimates);
        if (onRouteCalculated) {
          onRouteCalculated({
            pickup: p,
            destination: d,
            route: res.route,
          });
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to calculate route estimates');
    } finally {
      setLoadingEstimate(false);
    }
  };

  useEffect(() => {
    calculateEstimates();
  }, []);

  const handleSearch = async (query, type) => {
    if (type === 'pickup') {
      setPickupQuery(query);
    } else {
      setDestQuery(query);
    }

    if (query.trim().length > 1) {
      try {
        const res = await api.searchLocations(query);
        if (type === 'pickup') {
          setPickupSuggestions(res.locations || []);
        } else {
          setDestSuggestions(res.locations || []);
        }
      } catch (e) {}
    }
  };

  const selectLocation = (loc, type) => {
    if (type === 'pickup') {
      setPickup(loc);
      setPickupQuery(loc.name || loc.address);
      setPickupSuggestions([]);
      calculateEstimates(loc, destination);
    } else {
      setDestination(loc);
      setDestQuery(loc.name || loc.address);
      setDestSuggestions([]);
      calculateEstimates(pickup, loc);
    }
    setActiveInput(null);
  };

  const handleBooking = () => {
    if (!pickup?.coordinates || !destination?.coordinates) {
      setError('Please select valid pickup and destination locations');
      return;
    }

    onRequestRide({
      pickup: { address: pickup.address || pickup.name, coordinates: pickup.coordinates },
      destination: { address: destination.address || destination.name, coordinates: destination.coordinates },
      category: selectedCategory,
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-5 md:p-6 w-full max-w-md flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Where to?</h2>
        <p className="text-xs text-slate-500 mt-0.5">Reliable rides dispatched in seconds</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Location Input Group */}
      <div className="relative flex flex-col gap-2.5">
        {/* Pickup Input */}
        <div className="relative">
          <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-slate-900 focus-within:bg-white transition">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
            <input
              type="text"
              value={pickupQuery}
              onChange={(e) => handleSearch(e.target.value, 'pickup')}
              onFocus={() => setActiveInput('pickup')}
              placeholder="Enter pickup location"
              className="w-full bg-transparent text-sm font-medium text-slate-900 focus:outline-none placeholder:text-slate-400"
            />
          </div>

          {activeInput === 'pickup' && pickupSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
              {pickupSuggestions.map((loc, idx) => (
                <div
                  key={idx}
                  onMouseDown={() => selectLocation(loc, 'pickup')}
                  className="p-3 hover:bg-slate-50 cursor-pointer flex items-start gap-2.5 transition"
                >
                  <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{loc.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{loc.address}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Destination Input */}
        <div className="relative">
          <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-slate-50 border border-slate-200 focus-within:border-slate-900 focus-within:bg-white transition">
            <span className="w-3 h-3 rounded-sm bg-slate-900 shrink-0"></span>
            <input
              type="text"
              value={destQuery}
              onChange={(e) => handleSearch(e.target.value, 'dest')}
              onFocus={() => setActiveInput('dest')}
              placeholder="Where are you heading?"
              className="w-full bg-transparent text-sm font-medium text-slate-900 focus:outline-none placeholder:text-slate-400"
            />
          </div>

          {activeInput === 'dest' && destSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto">
              {destSuggestions.map((loc, idx) => (
                <div
                  key={idx}
                  onMouseDown={() => selectLocation(loc, 'dest')}
                  className="p-3 hover:bg-slate-50 cursor-pointer flex items-start gap-2.5 transition"
                >
                  <Navigation className="w-4 h-4 text-slate-900 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{loc.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{loc.address}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Route Distance & Duration Summary */}
      {routeInfo && (
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="font-semibold text-slate-900">{routeInfo.distanceKm} km</span>
            <span>•</span>
            <span className="font-semibold text-slate-900">{routeInfo.durationMin} mins away</span>
          </div>
          <span className="text-[11px] text-emerald-700 bg-emerald-100 font-semibold px-2 py-0.5 rounded-md">
            Fastest Route
          </span>
        </div>
      )}

      {/* Ride Category Options */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Choose a ride category
        </label>
        <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
          {estimates &&
            Object.keys(estimates).map((cat) => {
              const estimate = estimates[cat];
              const meta = CATEGORY_META[cat] || CATEGORY_META.economy;
              const isSelected = selectedCategory === cat;

              return (
                <div
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                    isSelected
                      ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{meta.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{meta.name}</span>
                        <span
                          className={`text-[10px] flex items-center gap-0.5 px-1.5 py-0.2 rounded font-medium ${
                            isSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Users className="w-2.5 h-2.5" />
                          {meta.capacity}
                        </span>
                      </div>
                      <p
                        className={`text-[11px] ${
                          isSelected ? 'text-slate-300' : 'text-slate-500'
                        }`}
                      >
                        {meta.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-base font-extrabold tracking-tight">
                      ${estimate.total.toFixed(2)}
                    </p>
                    {estimate.surgeMultiplier > 1 && (
                      <span className="text-[10px] text-amber-400 font-bold">
                        {estimate.surgeMultiplier}x Surge
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Booking Button */}
      <button
        onClick={handleBooking}
        disabled={isRequesting || loadingEstimate || !estimates}
        className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-slate-950 hover:bg-slate-800 active:scale-[0.99] transition disabled:opacity-50 disabled:pointer-events-none shadow-lg flex items-center justify-center gap-2"
      >
        {isRequesting ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Finding your driver...</span>
          </>
        ) : (
          <>
            <span>Request {CATEGORY_META[selectedCategory]?.name || 'RideFlow'}</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
};
