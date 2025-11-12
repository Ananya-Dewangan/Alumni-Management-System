import mongoose from 'mongoose';

const emailChangeRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // renamed
  currentEmail: { type: String, required: true },
  newEmail: { type: String, required: true }, // renamed from requestedEmail
  reason: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' },
}, { timestamps: true });

export default mongoose.model('EmailChangeRequest', emailChangeRequestSchema);