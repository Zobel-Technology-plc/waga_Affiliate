import dbConnect from '../../../../backend/config/dbConnect';
import Order from '../../../../backend/models/order';

export default async function handler(req, res) {
  const { id } = req.query;
  await dbConnect();

  if (req.method === 'PUT') {
    const { city, commission, totalAmount } = req.body;

    try {
      // Build an update object dynamically, only including fields that are provided
      const updateFields = {};
      if (city !== undefined) updateFields.address = city;
      if (commission !== undefined) updateFields.commissionamount = commission;
      if (totalAmount !== undefined) updateFields.totalAmount = totalAmount;

      // Update the order with the fields that are provided
      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        { $set: updateFields },
        { new: true }
      );

      res.status(200).json({ success: true, order: updatedOrder });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update order' });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
