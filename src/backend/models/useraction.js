// models/UserAction.js
import mongoose from 'mongoose';

const UserActionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  points: {
    type: Number,
    required: true,
  },
  joinerUserId: {
    type: Number,
    required: false, // Not all actions will have a joinerName
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.UserAction || mongoose.model('UserAction', UserActionSchema);
