import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  startingPrice: {
    type: Number,
    required: true,
  },
  commission:{
    type:Number,
    required:true
  },
  point:{
    type:Number,
    required:true,
  }
  
});

const Service = mongoose.models.Service || mongoose.model('Service', serviceSchema);

export default Service;
