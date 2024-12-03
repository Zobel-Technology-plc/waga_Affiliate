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
    required: [false, 'Please enter product price'],
  },
  commission: {
    type: Number,
    required: [true, 'Please enter product commission'],
  },
  images: [
    {
      public_id: { type: String },
      url: { type: String },
    },
  ],
  category: {
    type: String,
    required: [true, 'Please select a category'],
  },
  subcategory: {
    type: String,
    required: [true, 'Please select a subcategory'],
  },
  seller: {
    type: String,
    required: false, // Not mandatory, auto-filled from `userId`
  },
  stock: {
    type: Number,
    required: [true, 'Please enter product stock'],
  },
  ratings: {
    type: Number,
    default: 0,
  },
  freeDelivery: {
    type: Boolean,
    default: false, // Free delivery is false by default
  },
  onSale: {
    type: Boolean,
    default: false, // Product is not on sale by default
  },
  userId: {
    type: Number,
    required: false, // Not mandatory
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'], // Possible statuses
    required: function () {
      return !!this.userId; // Only required if userId is present
    },
    default: 'pending', // Default to 'pending' for user-created products
  },
});

export default mongoose.models.Product || mongoose.model('Product', productSchema);
