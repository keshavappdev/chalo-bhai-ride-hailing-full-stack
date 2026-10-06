import mongoose from 'mongoose';
const paymentSchema = new mongoose.Schema({
  ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  amount: { type: Number, required: true },
  platformFee: { type: Number, default: 0 },
  driverEarning: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  method: { type: String, enum: ['cash','online','wallet'], default: 'cash' },
  status: { type: String, enum: ['pending','paid','failed','refunded'], default: 'pending' },
  provider: String,
  providerPaymentId: String,
  paidAt: Date
}, { timestamps: true });
export default mongoose.model('Payment', paymentSchema);
