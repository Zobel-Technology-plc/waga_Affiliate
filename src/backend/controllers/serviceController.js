import Service from '../models/service';

export const getServices = async (req, res) => {
  try {
    const services = await Service.find();
    res.status(200).json({ success: true, data: services });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch services' });
  }
};

export const createService = async (req, res) => {
  try {
    const { name, startingPrice, commission, point } = req.body; // Ensure this matches the schema

    if (!name || !startingPrice || !commission || !point) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const newService = new Service({
      name,
      startingPrice,
      image: req.body.image, // Assuming the image URL is already parsed
      commission,
      point,
    });

    const savedService = await newService.save();
    res.status(201).json({ success: true, data: savedService });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create service' });
  }
};

