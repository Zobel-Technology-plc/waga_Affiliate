import dbConnect from '../../../../backend/config/dbConnect';
import Product from '../../../../backend/models/product';
import axios from 'axios';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    const { productId, seller } = req.body; // Use seller instead of userId

    console.log('Received productId:', productId); // Log productId
    console.log('Received seller:', seller); // Log seller

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required.' });
    }

    if (!seller) {
      return res.status(400).json({ success: false, message: 'Seller ID is required to send notification.' });
    }

    try {
      // Reject the product
      await Product.findByIdAndUpdate(productId, { status: 'rejected' });

      // Telegram Bot API credentials
      const botToken = '7350305630:AAGbLF6EUkCsblHfv0voojqIfitsOzQee6Y';
      const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

      // Construct the rejection message
      const message = `⚠️ We're sorry to inform you that your product (ID: ${productId}) has been rejected. Please review and make necessary changes before resubmitting.`;

      // Send Telegram notification
      await axios.post(telegramApiUrl, {
        chat_id: seller, // Use seller instead of userId
        text: message,
      });

      res.status(200).json({ success: true, message: 'Product rejected and seller notified.' });
    } catch (error) {
      console.error('Error rejecting product or sending notification:', error);
      res.status(500).json({ success: false, message: 'Failed to reject product or notify seller.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
