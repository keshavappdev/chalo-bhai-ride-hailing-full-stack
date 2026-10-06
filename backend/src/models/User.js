import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  avatarUrl: String,
  fcmTokens: [String],
  isActive: { type: Boolean, default: true },
  lastKnownLocation: { type: { type: String, enum: ['Point'], default: 'Point' }, coordinates: { type: [Number], default: [0,0] } }
}, { timestamps: true });
userSchema.index({ lastKnownLocation: '2dsphere' });
userSchema.methods.comparePassword = function(password) { return bcrypt.compare(password, this.passwordHash); };
userSchema.statics.hashPassword = (password) => bcrypt.hash(password, 12);
export default mongoose.model('User', userSchema);
