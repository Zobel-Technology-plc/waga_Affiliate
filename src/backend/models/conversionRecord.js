// File: /backend/models/conversionRecord.js

import mongoose from 'mongoose';

const ConversionRecordSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  pointsUsed: { type: Number, required: true },
  birrEquivalent: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }, // Automatically record the time of conversion
});

export default mongoose.models.ConversionRecord || mongoose.model('ConversionRecord', ConversionRecordSchema);
