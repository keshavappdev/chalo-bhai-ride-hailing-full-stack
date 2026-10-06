import mongoose from 'mongoose';
const placeSchema = new mongoose.Schema({
  address: { type: String, required: true },
  location: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], required: true } }
}, { _id: false });

const rideSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null, index: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', default: null },
  pickup: { type: placeSchema, required: true },
  destination: { type: placeSchema, required: true },
  requestedVehicleType: { type: String, enum: ['bike','auto','car','suv'], default: 'car' },
  status: {
    type: String,
    enum: ['searching','accepted','driver_arriving','arrived','in_progress','completed','cancelled'],
    default: 'searching', index: true
  },
  rejectedDrivers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Driver' }],
  estimatedDistanceKm: Number,
  estimatedDurationMinutes: Number,
  estimatedFare: Number,
  actualDistanceKm: Number,
  actualDurationMinutes: Number,
  finalFare: Number,
  paymentMethod: { type: String, enum: ['cash','online','wallet'], default: 'cash' },
  cancellation: { by: { type: String, enum: ['user','driver','admin'] }, reason: String, at: Date },
  acceptedAt: Date,
  arrivedAt: Date,
  startedAt: Date,
  completedAt: Date,
  lastDriverLocation: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], default: [0,0] } }
}, { timestamps: true });
rideSchema.index({ 'pickup.location': '2dsphere' });
rideSchema.index({ status: 1, createdAt: -1 });
export default mongoose.model('Ride', rideSchema);
