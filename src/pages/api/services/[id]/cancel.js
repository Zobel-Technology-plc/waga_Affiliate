import dbConnect from '../../../../backend/config/dbConnect';
import ServiceOrder from '../../../../backend/models/ServiceOrder';
import axios from 'axios';

export default async function handler(req, res) {
  const { id } = req.query; // This is the orderId
  await dbConnect();

  if (req.method === 'PUT') {
    try {
      // Find the service order by ID
      const order = await ServiceOrder.findById(id);
      
      if (!order) {
        return res.status(404).json({ success: false, message: 'Service order not found' });
      }

      // Check if the order is already completed
      if (order.status === 'complete') {
        return res.status(400).json({ success: false, message: 'Cannot cancel a completed service order' });
      }

      // Check if the order is already canceled
      if (order.status === 'canceled') {
        return res.status(400).json({ success: false, message: 'Service order is already canceled' });
      }

      // Update the service order status to 'canceled' and commissionStatus to 'canceled'
      const canceledOrder = await ServiceOrder.findByIdAndUpdate(
        id,
        {
          $set: {
            status: 'canceled',           // Update service order status
            commissionStatus: 'canceled', // Update commission status
          }
        },
        { new: true, runValidators: false } // Skip other field validations
      );

      // Send a message to the user using Telegram API
      const userId = order.userId; // Extract the userId from the service order
      const botToken = '7316973369:AAGYzlMkYWSgTobE6w7ETkDXrt0aR_a8YMg'; // Your bot token
      const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

      // Construct the message
      const message = `Dear user, your service order with ID: ${order.orderId} has been canceled.`;

      // Log userId and message for debugging
      console.log('Sending message to userId:', userId); // Log the userId
      console.log('Message being sent:', message);        // Log the message

      // Send a POST request to the Telegram Bot API and log response
      const telegramResponse = await axios.post(telegramApiUrl, {
        chat_id: userId,  // This must be the Telegram user ID, not your app's userId
        text: message     // The message to send
      });

      // Log the Telegram response
      console.log('Telegram Response:', telegramResponse.data);

      // Send back the updated service order information
      res.status(200).json({ success: true, order: canceledOrder, message: 'Service order canceled and user notified' });
    } catch (error) {
      console.error(error.response ? error.response.data : error);
      res.status(500).json({ success: false, message: 'Failed to cancel the service order or notify the user' });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
