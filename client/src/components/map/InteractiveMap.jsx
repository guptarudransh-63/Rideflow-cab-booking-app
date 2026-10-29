import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Custom SVG Icons
const createCarIcon = (heading = 0) => {
  return L.divIcon({
    className: 'custom-car-icon',
    html: `
      <div style="transform: rotate(${heading}deg); transition: transform 0.4s ease;" class="relative flex items-center justify-center w-10 h-10 drop-shadow-md">
        <div class="w-9 h-9 rounded-full bg-slate-900 border-2 border-white flex items-center justify-center text-white shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <path d="M9 17h6"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
        </div>
        <div class="absolute -top-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white"></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

const createPickupIcon = () => {
  return L.divIcon({
    className: 'custom-pickup-icon',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold pulse-emerald">
          <div class="w-2 h-2 rounded-full bg-white"></div>
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const createDestinationIcon = () => {
  return L.divIcon({
    className: 'custom-dest-icon',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="w-6 h-6 rounded-full bg-slate-900 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs">
          <div class="w-2.5 h-2.5 bg-white rounded-sm"></div>
        </div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

export const InteractiveMap = ({
  pickup = null,
  destination = null,
  driverLocation = null,
  polyline = [],
  onMapClick = null,
  height = '100%',
  className = '',
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const prevPolylineKeyRef = useRef('');
  const markersRef = useRef({
    pickup: null,
    destination: null,
    driver: null,
    polyline: null,
  });

  // Default center: San Francisco Market Street corridor
  const defaultCenter = [37.788, -122.407];

  // Effect 1: Map Initialization and Destruction
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapContainerRef.current._leaflet_id) {
      mapContainerRef.current._leaflet_id = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 14,
      zoomControl: false,
    });

    // Sleek clean CartoDB Positron / OSM tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>, &copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current = { pickup: null, destination: null, driver: null, polyline: null };
      prevPolylineKeyRef.current = '';
    };
  }, []);

  // Effect 2: Handle Map Click Callback
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = (e) => {
      if (onMapClick) {
        onMapClick([e.latlng.lng, e.latlng.lat]);
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [onMapClick]);

  // Effect 3: Update Markers & Route
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. Update Pickup Marker
    if (pickup && pickup.coordinates) {
      const latlng = [pickup.coordinates[1], pickup.coordinates[0]];
      if (!markersRef.current.pickup) {
        markersRef.current.pickup = L.marker(latlng, { icon: createPickupIcon() }).addTo(map);
      } else {
        markersRef.current.pickup.setLatLng(latlng);
      }
    } else if (markersRef.current.pickup) {
      map.removeLayer(markersRef.current.pickup);
      markersRef.current.pickup = null;
    }

    // 2. Update Destination Marker
    if (destination && destination.coordinates) {
      const latlng = [destination.coordinates[1], destination.coordinates[0]];
      if (!markersRef.current.destination) {
        markersRef.current.destination = L.marker(latlng, { icon: createDestinationIcon() }).addTo(map);
      } else {
        markersRef.current.destination.setLatLng(latlng);
      }
    } else if (markersRef.current.destination) {
      map.removeLayer(markersRef.current.destination);
      markersRef.current.destination = null;
    }

    // 3. Update Driver Marker
    if (driverLocation && driverLocation.coordinates) {
      const latlng = [driverLocation.coordinates[1], driverLocation.coordinates[0]];
      const heading = driverLocation.heading || 0;
      if (!markersRef.current.driver) {
        markersRef.current.driver = L.marker(latlng, { icon: createCarIcon(heading) }).addTo(map);
      } else {
        markersRef.current.driver.setLatLng(latlng);
        markersRef.current.driver.setIcon(createCarIcon(heading));
      }
    } else if (markersRef.current.driver) {
      map.removeLayer(markersRef.current.driver);
      markersRef.current.driver = null;
    }

    // 4. Update Route Polyline
    if (polyline && polyline.length > 1) {
      const latlngs = polyline.map((c) => [c[1], c[0]]);
      const polylineKey = `${latlngs[0]?.join(',')}_${latlngs[latlngs.length - 1]?.join(',')}_${latlngs.length}`;

      if (!markersRef.current.polyline) {
        markersRef.current.polyline = L.polyline(latlngs, {
          color: '#10b981', // Emerald green route polyline
          weight: 5,
          opacity: 0.85,
          lineJoin: 'round',
        }).addTo(map);
      } else {
        markersRef.current.polyline.setLatLngs(latlngs);
      }

      // Auto-fit bounds only when polyline actually changes (not on every driver GPS tick)
      if (prevPolylineKeyRef.current !== polylineKey) {
        prevPolylineKeyRef.current = polylineKey;
        const bounds = L.latLngBounds(latlngs);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    } else if (markersRef.current.polyline) {
      map.removeLayer(markersRef.current.polyline);
      markersRef.current.polyline = null;
      prevPolylineKeyRef.current = '';
    } else if (pickup && pickup.coordinates) {
      // Focus on pickup if no polyline
      map.panTo([pickup.coordinates[1], pickup.coordinates[0]]);
    }
  }, [pickup, destination, driverLocation, polyline]);

  return (
    <div className={`relative w-full overflow-hidden ${className}`} style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
