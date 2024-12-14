import mongoose from 'mongoose';

const earnOptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  points: { type: Number, required: true },
  icon: { type: String, required: true },
  link: { 
    type: String, 
    default: '', 
    validate: {
      validator: function(v) {
        // `link` is only required if `text` is neither "Invite Your Friend" nor "Share to Stories"
        return this.text === "Invite Your Friend" || this.text === "Share to Stories" || v.length > 0;
      },
      message: props => `${props.path} is required unless text is "Invite Your Friend" or "Share to Stories"`,
    },
  },
  image: { type: String, default: null }, // Optional for "Share to Stories"
  description: { type: String, default: null }, // Optional for "Share to Stories"
  requiresCheck: { type: Boolean, default: true },
  category: { 
    type: String, 
    required: [true, 'Please specify a category for the earn option'],
  },
});

export default mongoose.models.EarnOption || mongoose.model('EarnOption', earnOptionSchema);
