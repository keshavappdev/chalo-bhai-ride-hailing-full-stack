import mongoose from 'mongoose';
const locationSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true, index: true },
  ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', index: true },
  point: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], required: true } },
  heading: Number,
  speed: Number,
  accuracy: Number,
  recordedAt: { type: Date, default: Date.now, expires: '30d' }
}, { timestamps: false });
locationSchema.index({ point: '2dsphere' });
locationSchema.index({ driver: 1, recordedAt: -1 });
export default mongoose.model('Location', locationSchema);
