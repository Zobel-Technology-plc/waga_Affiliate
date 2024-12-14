import dbConnect from '../../../backend/config/dbConnect';
import User from '../../../backend/models/user';
import axios from 'axios';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    try {
      const user = await User.findOne({ userId });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (user.role === 'seller') {
        return res.status(400).json({ success: false, message: 'User is already a seller' });
      }

      if (user.status === 'pending') {
        return res.status(400).json({ success: false, message: 'Request already pending' });
      }

      // Update user's status to 'pending'
      user.status = 'pending';
      await user.save();

      // Telegram Bot API credentials
      const botToken = '7316973369:AAGYzlMkYWSgTobE6w7ETkDXrt0aR_a8YMg';
      const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

      // Construct the notification message
      const message = `🚀 User ID: ${userId} has requested to become a seller. Please review and take appropriate action.`;

      // Send Telegram notification to admin (302775107)
      await axios.post(telegramApiUrl, {
        chat_id: '302775107',
        text: message,
      });

      res.status(200).json({ success: true, message: 'Request submitted successfully, admin notified.' });
    } catch (error) {
      console.error('Error submitting seller request or sending notification:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
