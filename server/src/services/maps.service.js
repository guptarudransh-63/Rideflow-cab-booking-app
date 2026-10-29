import { ENV } from '../config/env.js';

// Pre-seeded realistic landmark locations for instant search & demo
export const POPULAR_LOCATIONS = [
  { name: 'Downtown Financial Center', address: '100 Market St, Financial District', coordinates: [-122.399, 37.793] },
  { name: 'International Airport (SFO)', address: 'Terminal 2, San Francisco Airport', coordinates: [-122.378, 37.621] },
  { name: 'Golden Gate Park & Museum', address: '50 Hagiwara Tea Garden Dr', coordinates: [-122.468, 37.770] },
  { name: 'Fisherman’s Pier & Marina', address: 'Pier 39, Beach St & The Embarcadero', coordinates: [-122.409, 37.808] },
  { name: 'Mission District Arts Corridor', address: '599 Valencia St, Mission District', coordinates: [-122.421, 37.763] },
  { name: 'SoMa Tech Campus Hub', address: '650 Townsend St, SoMa', coordinates: [-122.403, 37.771] },
  { name: 'Union Square Retail District', address: '333 Post St, Union Square', coordinates: [-122.407, 37.788] },
  { name: 'Civic Center & Opera Plaza', address: '355 McAllister St, Civic Center', coordinates: [-122.418, 37.780] },
  { name: 'Presidio Scenic Overlook', address: '210 Lincoln Blvd, Presidio', coordinates: [-122.455, 37.799] },
  { name: 'Sunset District Oceanside', address: '1390 46th Ave, Sunset', coordinates: [-122.505, 37.761] },
];

/**
 * Calculates Haversine distance between two [lng, lat] points in kilometers
 */
export const calculateHaversineDistanceKm = (coords1, coords2) => {
  const [lon1, lat1] = coords1;
  const [lon2, lat2] = coords2;

  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
};

/**
 * Generate a realistic road polyline between start and end coordinates
 */
export const generateRoutePolyline = (startCoords, endCoords, numWaypoints = 8) => {
  const [startLng, startLat] = startCoords;
  const [endLng, endLat] = endCoords;

  const polyline = [[startLng, startLat]];

  for (let i = 1; i <= numWaypoints; i++) {
    const fraction = i / (numWaypoints + 1);
    // Add realistic urban street grid zigzag deviations
    const midLng = startLng + (endLng - startLng) * fraction;
    const midLat = startLat + (endLat - startLat) * fraction;
    
    // Add slight deterministic road jitter based on sine wave
    const jitterFactor = Math.sin(fraction * Math.PI * 2) * 0.0035;
    polyline.push([
      Math.round((midLng + jitterFactor) * 100000) / 100000,
      Math.round((midLat - jitterFactor * 0.5) * 100000) / 100000,
    ]);
  }

  polyline.push([endLng, endLat]);
  return polyline;
};

export class MapsService {
  /**
   * Search locations by query string (autocomplete / geocode)
   */
  static async searchLocations(query) {
    if (!query || query.trim().length === 0) {
      return POPULAR_LOCATIONS.slice(0, 5);
    }

    const lowerQuery = query.toLowerCase().trim();
    const matched = POPULAR_LOCATIONS.filter(
      (loc) =>
        loc.name.toLowerCase().includes(lowerQuery) ||
        loc.address.toLowerCase().includes(lowerQuery)
    );

    if (matched.length > 0) {
      return matched;
    }

    // If no hardcoded landmark matched, synthesize a realistic coordinate near city center
    return [
      {
        name: query,
        address: `${query}, San Francisco, CA`,
        coordinates: [
          -122.4194 + (Math.random() - 0.5) * 0.05,
          37.7749 + (Math.random() - 0.5) * 0.05,
        ],
      },
      ...POPULAR_LOCATIONS.slice(0, 3),
    ];
  }

  /**
   * Get route details between pickup and destination coordinates
   */
  static async getRoute(pickupCoords, destinationCoords) {
    const straightKm = calculateHaversineDistanceKm(pickupCoords, destinationCoords);
    
    // Road distance is typically 1.25x - 1.35x straight line in urban grid
    const roadDistanceKm = Math.max(1.0, Math.round(straightKm * 1.28 * 10) / 10);
    
    // Urban speed average ~ 30 km/h with traffic lights (2 mins per km)
    const durationMin = Math.max(4, Math.round(roadDistanceKm * 2.2));
    
    const polyline = generateRoutePolyline(pickupCoords, destinationCoords);

    return {
      distanceKm: roadDistanceKm,
      durationMin: durationMin,
      polyline: polyline,
      isSimulated: ENV.MAP_PROVIDER === 'simulation',
      provider: ENV.MAP_PROVIDER,
    };
  }
}
