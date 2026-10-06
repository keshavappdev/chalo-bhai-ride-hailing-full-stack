import mongoose from 'mongoose';
const ratingSchema = new mongoose.Schema({
  ride: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride', required: true, index: true },
  fromRole: { type: String, enum: ['user','driver'], required: true },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fromDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  toDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  rating: { type: Number, min: 1, max: 5, required: true },
  review: { type: String, maxlength: 1000 }
}, { timestamps: true });
ratingSchema.index({ ride: 1, fromRole: 1 }, { unique: true });
export default mongoose.model('Rating', ratingSchema);
