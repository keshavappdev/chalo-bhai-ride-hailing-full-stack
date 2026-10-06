import mongoose from 'mongoose';
const vehicleSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true, index: true },
  make: { type: String, required: true },
  model: { type: String, required: true },
  color: { type: String, required: true },
  plateNumber: { type: String, required: true, unique: true, uppercase: true },
  type: { type: String, enum: ['bike','auto','car','suv'], default: 'car' },
  year: Number,
  isActive: { type: Boolean, default: true },
  documents: { registrationUrl: String, insuranceUrl: String }
}, { timestamps: true });
export default mongoose.model('Vehicle', vehicleSchema);
