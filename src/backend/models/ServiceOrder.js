import mongoose from 'mongoose';

const serviceOrderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  serviceId: {
    type: String,
    required: true,
    unique: true,
  },
  serviceName: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: function() {
      return this.orderFor === 'other';
    },
  },
  phoneNumber: {
    type: String,
    required: function() {
      return this.orderFor === 'other';
    },
  },
  orderFor: {
    type: String,
    enum: ['self', 'other'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'complete','canceled'],
    default: 'pending',
  },
  points: {
    type: Number,
    default: 10000,
  },
  commission: {
    type: Number,
    required: true, // Required to store the commission amount
  },
  commissionStatus: {
    type: String,
    enum: ['pending', 'paid','canceled'],
    default: 'pending', // Default to 'pending'
  },
  totalAmount: {
    type: Number,
    required: true, // Required to store the total amount
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

serviceOrderSchema.index({ createdAt: 1 });

const ServiceOrder = mongoose.models.ServiceOrder || mongoose.model('ServiceOrder', serviceOrderSchema);

export default ServiceOrder;
