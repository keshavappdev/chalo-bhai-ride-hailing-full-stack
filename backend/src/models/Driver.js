import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  avatarUrl: String,
  licenseNumber: { type: String, required: true, unique: true },
  verificationStatus: { type: String, enum: ['pending','approved','rejected','suspended'], default: 'pending', index: true },
  isOnline: { type: Boolean, default: false, index: true },
  isBusy: { type: Boolean, default: false, index: true },
  currentLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0,0] }
  },
  heading: { type: Number, default: 0 },
  lastLocationAt: Date,
  ratingAverage: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  fcmTokens: [String]
}, { timestamps: true });
driverSchema.index({ currentLocation: '2dsphere' });
driverSchema.index({ isOnline: 1, isBusy: 1, verificationStatus: 1 });
driverSchema.methods.comparePassword = function(password) { return bcrypt.compare(password, this.passwordHash); };
driverSchema.statics.hashPassword = (password) => bcrypt.hash(password, 12);
export default mongoose.model('Driver', driverSchema);
