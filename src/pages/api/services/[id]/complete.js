import dbConnect from '../../../../backend/config/dbConnect';
import Order from '../../../../backend/models/ServiceOrder';
import User from '../../../../backend/models/user';
import axios from 'axios';

export default async function handler(req, res) {
  const { id } = req.query;
  await dbConnect();

  if (req.method === 'PUT') {
    try {
      console.log(`Received order id: ${id}`);

      const order = await Order.findById(id);
      if (!order) {
        console.error(`Order with id ${id} not found`);
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      const commissionAmount = order.totalAmount * (order.commission / 100);

      // Update the order's status, commission status, and commission amount
      const completedServiceOrder = await Order.findByIdAndUpdate(
        id,
        {
          $set: {
            commissionStatus: 'Complete',
            status: 'Complete',
            commissionAmount: commissionAmount, // Save calculated commission amount
          },
        },
        { new: true }
      );

      const { userId, points } = completedServiceOrder;

      const user = await User.findOne({ userId: userId.toString() });
      if (!user) {
        console.error(`User with id ${userId} not found`);
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      user.commission = (user.commission || 0) + commissionAmount;
      user.points = (user.points || 0) + points;
      await user.save();

      const botToken = '7316973369:AAGYzlMkYWSgTobE6w7ETkDXrt0aR_a8YMg';
      const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

      const message = `Dear user, your service order with ID: ${order.serviceId} has arrived. Commission added: ${commissionAmount} and points earned: ${points}.`;

      console.log('Sending message to userId:', userId);
      console.log('Message being sent:', message);

      const telegramResponse = await axios.post(telegramApiUrl, {
        chat_id: userId,
        text: message
      });

      console.log('Telegram Response:', telegramResponse.data);

      return res.status(200).json({ 
        success: true, 
        order: completedServiceOrder, 
        commissionAdded: commissionAmount,
        message: 'Order completed and user notified via Telegram.'
      });

    } catch (error) {
      console.error('Error completing the order:', error);
      return res.status(500).json({ success: false, message: 'Failed to complete order due to a server error.' });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
