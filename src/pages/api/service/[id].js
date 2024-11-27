import dbConnect from '../../../backend/config/dbConnect';
import Service from '../../../backend/models/service';

export default async function handler(req, res) {
  await dbConnect();

  const { id } = req.query;

  switch (req.method) {
    case 'PUT': // Edit Service
    try {
      console.log('Request Body:', req.body); // Debug log
  
      const { name, startingPrice, commission, point } = req.body;
  
      if (!name || !startingPrice || !commission || !point) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: name, startingPrice, commission, or point',
        });
      }
  
      const updatedFields = { name, startingPrice, commission, point };
  
      const updatedService = await Service.findByIdAndUpdate(id, updatedFields, { new: true });
  
      if (!updatedService) {
        return res.status(404).json({ success: false, message: 'Service not found.' });
      }
  
      res.status(200).json({ success: true, data: updatedService });
    } catch (error) {
      console.error('Error updating service:', error);
      res.status(500).json({ success: false, message: 'Failed to update service.' });
    }
    break;
  
      try {
        const { name, startingPrice, commission, point } = req.body;

        if (!name || !startingPrice || !commission || !point) {
          return res.status(400).json({
            success: false,
            message: 'Missing required fields: name, startingPrice, commission, or point',
          });
        }

        const updatedFields = { name, startingPrice, commission, point };

        const updatedService = await Service.findByIdAndUpdate(id, updatedFields, { new: true });

        if (!updatedService) {
          return res.status(404).json({ success: false, message: 'Service not found.' });
        }

        res.status(200).json({ success: true, data: updatedService });
      } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).json({ success: false, message: 'Failed to update service.' });
      }
      break;

    case 'DELETE': // Delete Service
      try {
        const deletedService = await Service.findByIdAndDelete(id);

        if (!deletedService) {
          return res.status(404).json({ success: false, message: 'Service not found.' });
        }

        res.status(200).json({ success: true, message: 'Service deleted successfully.' });
      } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({ success: false, message: 'Failed to delete service.' });
      }
      break;

    default:
      res.setHeader('Allow', ['PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
