import dbConnect from '../../../backend/config/dbConnect';
import User from '../../../backend/models/user';
import axios from 'axios';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false, // Disable body parser to handle file uploads
  },
};

const botToken = "7350305630:AAFT8WHJATAN9aV71eL1WoiCYCuA-LslLkc"; // Replace with your actual bot token
const telegramApiUrl = `https://api.telegram.org/bot${botToken}`;

const sendTelegramMessage = async (chatId, text, photoPath) => {
  try {
    if (photoPath) {
      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('caption', text);
      formData.append('photo', fs.createReadStream(photoPath));

      await axios.post(`${telegramApiUrl}/sendPhoto`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });
    } else {
      await axios.post(`${telegramApiUrl}/sendMessage`, {
        chat_id: chatId,
        text,
      });
    }
  } catch (error) {
    console.error(`Error sending message to ${chatId}:`, error);
  }
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const form = formidable({ multiples: true });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Error parsing form:', err);
        return res.status(500).json({ success: false, message: 'Form parsing error' });
      }

      const message = Array.isArray(fields.message) ? fields.message[0] : fields.message || '';
      const photoPath = files.image ? files.image.filepath : null;

      try {
        await dbConnect();
        const users = await User.find({}).select('userId'); // Select only userId field

        for (const user of users) {
          await sendTelegramMessage(user.userId, message, photoPath);
        }

        if (photoPath) fs.unlinkSync(photoPath); // Delete the uploaded file after sending

        res.status(200).json({ success: true, message: 'Message broadcasted to all users' });
      } catch (error) {
        console.error('Error broadcasting message:', error);
        res.status(500).json({ success: false, message: 'Failed to broadcast message' });
      }
    });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
