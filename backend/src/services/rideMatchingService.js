import Driver from '../models/Driver.js';
import Vehicle from '../models/Vehicle.js';
import { env } from '../config/env.js';
import { getIo } from '../sockets/ioStore.js';

export async function findNearbyDrivers(ride, limit=20) {
  const [lng, lat] = ride.pickup.location.coordinates;
  const drivers = await Driver.find({
    verificationStatus: 'approved', isOnline: true, isBusy: false, lastLocationAt: { $gte: new Date(Date.now() - 60000) },
    _id: { $nin: ride.rejectedDrivers || [] },
    currentLocation: { $near: { $geometry: { type: 'Point', coordinates: [lng, lat] }, $maxDistance: env.driverSearchRadiusMeters } }
  }).limit(limit).lean();
  if (!drivers.length) return [];
  const driverIds = drivers.map(d => d._id);
  const vehicles = await Vehicle.find({ driver: { $in: driverIds }, isActive: true, type: ride.requestedVehicleType }).lean();
  const vehicleByDriver = new Map(vehicles.map(v => [v.driver.toString(), v]));
  return drivers.filter(d => vehicleByDriver.has(d._id.toString())).map(d => ({ ...d, vehicle: vehicleByDriver.get(d._id.toString()) }));
}

export async function broadcastRideRequest(ride) {
  const candidates = await findNearbyDrivers(ride);
  const io = getIo();
  for (const d of candidates) {
    io.to(`driver:${d._id}`).emit('ride:request', { ride, vehicle: d.vehicle });
  }
  io.to(`user:${ride.user}`).emit('ride:searching', { rideId: ride._id, candidateCount: candidates.length });
  return candidates.length;
}
