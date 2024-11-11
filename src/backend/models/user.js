import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: String,
  lastName: String,
  username: String,
  languageCode: String,
  phoneNumber: String,
  city: String,
  points: {
    type: Number,
    default: 0,
  },
  commission: {
    type: Number,
    default: 0,
  },
  hasJoinedViaInvite: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastMessageStatus: {
    type: String,
    enum: ['success', 'failed'],
    default: null,
  },
  lastMessageDate: {
    type: Date,
    default: null,
  },
});

export default mongoose.models.User || mongoose.model("User", userSchema);
