import mongoose from 'mongoose';
const notificationSchema = new mongoose.Schema({
  recipientRole: { type: String, enum: ['user','driver','admin'], required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  type: { type: String, default: 'general' },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  readAt: Date
}, { timestamps: true });
notificationSchema.index({ recipientRole: 1, recipientId: 1, createdAt: -1 });
export default mongoose.model('Notification', notificationSchema);
