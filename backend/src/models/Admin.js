import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
const adminSchema = new mongoose.Schema({
  name: { type: String, default: 'Administrator' },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true, select: false },
  permissions: { type: [String], default: ['*'] },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
adminSchema.methods.comparePassword = function(password){ return bcrypt.compare(password, this.passwordHash); };
adminSchema.statics.hashPassword = (password) => bcrypt.hash(password, 12);
export default mongoose.model('Admin', adminSchema);
