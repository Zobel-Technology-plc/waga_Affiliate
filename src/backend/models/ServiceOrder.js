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
  city: {
    type: String,
    required: function() {
      return this.orderFor === 'other'; // City is required only if the order is for others
    },
  },
  phoneNumber: {
    type: String,
    required: function() {
      return this.orderFor === 'other'; // Phone number is required only if the order is for others
    },
  },
  orderFor: {
    type: String,
    enum: ['self', 'other'],
    required: true,
  },
  status: {
    type: String,
    default: 'pending',
  },
}, { timestamps: true });

const ServiceOrder = mongoose.models.ServiceOrder || mongoose.model('ServiceOrder', serviceOrderSchema);

export default ServiceOrder;