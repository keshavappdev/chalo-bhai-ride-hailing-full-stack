import { env } from '../config/env.js';
import { haversineKm } from '../utils/geo.js';

export async function getRouteMetrics(origin, destination) {
  if (env.googleRoutesKey) {
    try {
      const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': env.googleRoutesKey,
          'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration'
        },
        body: JSON.stringify({
          origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
          destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE'
        })
      });
      if (response.ok) {
        const data = await response.json();
        const route = data.routes?.[0];
        if (route) return { distanceKm: route.distanceMeters / 1000, durationMinutes: Number(String(route.duration).replace('s','')) / 60, source: 'google_routes' };
      }
    } catch (e) { console.warn('Google Routes fallback:', e.message); }
  }
  const distanceKm = haversineKm(origin, destination) * 1.25;
  return { distanceKm, durationMinutes: Math.max(3, distanceKm / 28 * 60), source: 'fallback' };
}
