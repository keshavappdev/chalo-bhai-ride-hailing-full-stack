import { z } from 'zod';

const lat = z.number().min(-90).max(90);
const lng = z.number().min(-180).max(180);
const base = (body) => z.object({ body, query: z.any().optional(), params: z.any().optional() });

export const userLocationSchema = base(z.object({ lat, lng }));
export const driverOnlineSchema = base(z.object({
  isOnline: z.boolean(),
  lat: lat.optional(),
  lng: lng.optional()
}).refine((v) => (v.lat == null) === (v.lng == null), { message: 'lat and lng must be supplied together' }));
export const driverLocationSchema = base(z.object({
  lat, lng,
  heading: z.number().min(0).max(360).optional(),
  speed: z.number().min(0).optional(),
  accuracy: z.number().min(0).optional(),
  rideId: z.string().optional()
}));
export const fareEstimateSchema = base(z.object({
  pickup: z.object({ lat, lng }),
  destination: z.object({ lat, lng })
}));
export const rideStatusSchema = base(z.object({
  status: z.enum(['driver_arriving', 'arrived', 'in_progress', 'completed'])
}));
export const cancelRideSchema = base(z.object({ reason: z.string().max(500).optional() }));
export const ratingSchema = base(z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().max(1000).optional()
}));
export const deviceTokenSchema = base(z.object({ token: z.string().min(10) }));
export const profileSchema = base(z.object({
  name: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().optional()
}).refine((v) => Object.keys(v).length > 0, { message: 'At least one field is required' }));
export const vehiclePatchSchema = base(z.object({
  make: z.string().min(1).max(80).optional(),
  model: z.string().min(1).max(80).optional(),
  color: z.string().min(1).max(50).optional(),
  type: z.enum(['bike', 'auto', 'car', 'suv']).optional(),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 1).optional(),
  isActive: z.boolean().optional()
}).refine((v) => Object.keys(v).length > 0, { message: 'At least one field is required' }));
