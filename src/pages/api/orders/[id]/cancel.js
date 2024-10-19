import dbConnect from '../../../../backend/config/dbConnect';
import Order from '../../../../backend/models/order';
import axios from 'axios';

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

      // Send a message to the user using Telegram API
      const userId = order.userId; // Extract the userId from the order
      const botToken = '7316973369:AAGYzlMkYWSgTobE6w7ETkDXrt0aR_a8YMg'; // Your bot token
      const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

      // Construct the message
      const message = `Dear user, your order with ID: ${order.orderId} has been canceled.`;

      // Send a POST request to the Telegram Bot API
      await axios.post(telegramApiUrl, {
        chat_id: userId,  // Telegram chat id (the userId of the user)
        text: message     // The message to send
      });

      // Send back the updated order information
      res.status(200).json({ success: true, order: canceledOrder, message: 'Order canceled and user notified' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Failed to cancel the order or notify the user' });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
