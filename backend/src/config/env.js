import dotenv from 'dotenv';
dotenv.config();

const required = ['MONGODB_URI', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  origins: (process.env.CLIENT_ORIGINS || '*').split(',').map((v) => v.trim()),
  googleRoutesKey: process.env.GOOGLE_ROUTES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '',
  firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '',
  fare: {
    base: Number(process.env.FARE_BASE || 50),
    perKm: Number(process.env.FARE_PER_KM || 12),
    perMinute: Number(process.env.FARE_PER_MINUTE || 2),
    minimum: Number(process.env.FARE_MINIMUM || 80)
  },
  driverSearchRadiusMeters: Number(process.env.DRIVER_SEARCH_RADIUS_METERS || 7000)
};
