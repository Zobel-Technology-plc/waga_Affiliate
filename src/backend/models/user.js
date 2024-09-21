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
  city: String, // Add city field to store user's city
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
});

export default mongoose.models.User || mongoose.model("User", userSchema);
