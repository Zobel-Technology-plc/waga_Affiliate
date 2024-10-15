import dbConnect from '../../../../backend/config/dbConnect';
import Order from '../../../../backend/models/order';

export default async function handler(req, res) {
  const { id } = req.query; // This is the orderId
  await dbConnect();

  if (req.method === 'PUT') {
    try {
      // Find the order by ID
      const order = await Order.findById(id);
      
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // Check if the order is already completed
      if (order.commissionStatus === 'completed') {
        return res.status(400).json({ success: false, message: 'Cannot cancel a completed order' });
      }

      // Check if the order is already canceled
      if (order.status === 'canceled') {
        return res.status(400).json({ success: false, message: 'Order is already canceled' });
      }

      // Update the order status to 'canceled' and commissionStatus to 'canceled'
      const canceledOrder = await Order.findByIdAndUpdate(
        id,
        {
          $set: {
            status: 'canceled',           // Update order status
            commissionStatus: 'canceled', // Update commission status
          }
        },
        { new: true, runValidators: false } // Skip other field validations
      );

      // Send back the updated order information
      res.status(200).json({ success: true, order: canceledOrder });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Failed to cancel the order' });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
