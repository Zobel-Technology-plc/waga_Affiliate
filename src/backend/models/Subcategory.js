// backend/models/Subcategory.js
import mongoose from 'mongoose';

const subcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter subcategory name'],
  },
  image: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  category: {
    type: String,
    required: [true, 'Please enter category name'],
  },
});

export default mongoose.models.Subcategory || mongoose.model('Subcategory', subcategorySchema);
