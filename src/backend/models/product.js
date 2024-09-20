// backend/models/Product.js
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter product name'],
  },
  description: {
    type: String,
    required: [true, 'Please enter product description'],
  },
  price: {
    type: Number,
    required: [true, 'Please enter product price'],
  },
  images: [
    {
      public_id: { type: String },
      url: { type: String },
    },
  ],
  category: {  // Store category as a string
    type: String,
    required: [true, 'Please select a category'],
  },
  subcategory: {
    type: String,
    required: [true, 'Please select a subcategory'],
  },
  seller: {
    type: String,
    required: [true, 'Please enter product seller'],
  },
  stock: {
    type: Number,
    required: [true, 'Please enter product stock'],
  },
  ratings: {
    type: Number,
    default: 0,
  },
});

export default mongoose.models.Product || mongoose.model('Product', productSchema);
