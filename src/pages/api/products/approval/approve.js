import dbConnect from '../../../../backend/config/dbConnect';
import Product from '../../../../backend/models/product';
import axios from 'axios';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    const { productId, seller } = req.body;

    console.log('Received productId:', productId); // Log productId
    console.log('Received seller:', seller); // Log seller

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    if (!seller) {
      return res.status(400).json({ success: false, message: 'Seller ID is required to send notification.' });
    }

    try {
      // Approve the product
      await Product.findByIdAndUpdate(productId, { status: 'approved' });

      // Telegram Bot API credentials
      const botToken = 'YOUR_TELEGRAM_BOT_TOKEN';
      const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

      // Construct the approval message
      const message = `🎉 Congratulations! Your product (ID: ${productId}) has been approved and is now live on our platform.`;

      // Send Telegram notification
      await axios.post(telegramApiUrl, {
        chat_id: seller, // Use seller for the notification
        text: message,
      });

      res.status(200).json({ success: true, message: 'Product approved and seller notified.' });
    } catch (error) {
      console.error('Error approving product or sending notification:', error);
      res.status(500).json({ success: false, message: 'Failed to approve product or notify seller.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
