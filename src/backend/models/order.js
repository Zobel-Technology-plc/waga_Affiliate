// src/backend/models/order.js

import mongoose from 'mongoose';
import { nanoid } from 'nanoid';

// Define order item schema
const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  image: { type: String, required: true },
});

// Define order schema
const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    default: () => nanoid(7), // Generate a unique 7-character orderId
  },
  userId: { type: String, required: true },
  orderItems: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  commissionamount: { type: Number },  // Store the commission amount
  commissionStatus: {  // Track the status of the commission
    type: String,
    enum: ['pending', 'completed' , 'canceled'],
    default: 'pending',  // Initially set commission to 'pending'
  },
  city: { type: String, required: false, },
  phoneNumber: { type: String },
  orderFor: {
    type: String,
    enum: ['self', 'other'],
    required: true,
  },
  paymentStatus: {
    type: String,
    default: 'Pending',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

orderSchema.index({ createdAt: 1 }); 

// Export the model
export default mongoose.models.Order || mongoose.model('Order', orderSchema);