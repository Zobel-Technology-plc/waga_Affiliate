import dbConnect from '../../../../backend/config/dbConnect';
import ServiceOrder from '../../../../backend/models/ServiceOrder'; // Ensure this model name is correct

export default async function handler(req, res) {
  const { id } = req.query;
  await dbConnect();

  if (req.method === 'PUT') {
    const { city, commission, totalAmount } = req.body;  // Ensure the names match the schema

    try {
      // Build an update object dynamically, only including fields that are provided
      const updateFields = {};
      if (city !== undefined) updateFields.address = city;  // Updating address (city)
      if (commission !== undefined) updateFields.commissionAmount = commission;  // Ensure camelCase naming
      if (totalAmount !== undefined) updateFields.totalAmount = totalAmount;

      const updatedServiceOrder = await ServiceOrder.findByIdAndUpdate(
        id,
        { $set: updateFields },  // Use the dynamically created update object
        { new: true }
      );

      if (!updatedServiceOrder) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      res.status(200).json({ success: true, order: updatedServiceOrder });
    } catch (error) {
      console.error('Error updating service order:', error);
      res.status(500).json({ success: false, message: 'Failed to update order' });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
