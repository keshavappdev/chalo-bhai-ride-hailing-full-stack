import { env } from '../config/env.js';
export function calculateFare(distanceKm, durationMinutes) {
  const raw = env.fare.base + distanceKm * env.fare.perKm + durationMinutes * env.fare.perMinute;
  return Math.max(env.fare.minimum, Math.round(raw * 100) / 100);
}
