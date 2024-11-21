import mongoose from 'mongoose';

const ConversionRecordSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  pointsUsed: { type: Number, required: true },
  birrEquivalent: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }, 
  timestamp: { type: Date, default: Date.now },
  // Default status
});

export default mongoose.models.ConversionRecord || mongoose.model('ConversionRecord', ConversionRecordSchema);
