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
  cashoutInProgress: {
    type: Boolean,
    default: false,
  },
  bankAccount: {
    type: String,
    default: null,
  },
  accountHolderName: {
    type: String,
    default: null,
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
  role: {
    type: String,
    enum: ['seller', 'affiliate_buyer'], // Predefined roles
    default: 'affiliate_buyer', // Default to 'affiliate_buyer'
  },
});

export default mongoose.models.User || mongoose.model("User", userSchema);
