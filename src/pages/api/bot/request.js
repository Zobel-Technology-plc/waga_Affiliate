import dbConnect from '../../../backend/config/dbConnect';
import User from '../../../backend/models/user';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { userId, type } = req.body;

    // Define message text and reply_markup based on the request type
    const message =
      type === 'phone number'
        ? 'እባክዎን ከታች የተቀመጠውን SHARE PHONE NUMBER በመንካት የስልክ ቁጥርዎን ያስገቡ'
        : 'እባክዎን ያሉበትን ከተማ ስም ያስገቡ';

    const replyMarkup =
      type === 'phone number'
        ? {
            reply_markup: {
              keyboard: [
                [
                  {
                    text: '📞 Share Phone Number',
                    request_contact: true,
                  },
                ],
              ],
              resize_keyboard: true,
              one_time_keyboard: true,
            },
          }
        : {};

    // Connect to DB and find user by userId
    await dbConnect();
    const user = await User.findOne({ userId });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    try {
      // Send a message via Telegram bot
      const botToken = '7316973369:AAGYzlMkYWSgTobE6w7ETkDXrt0aR_a8YMg'; // Replace with your bot token
      const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

      await axios.post(telegramApiUrl, {
        chat_id: userId, // Ensure this is the correct Telegram chat ID
        text: message,
        ...replyMarkup,
      });

      res.status(200).json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
      console.error('Error sending message via bot:', error);
      res.status(500).json({ success: false, message: 'Failed to send message' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
