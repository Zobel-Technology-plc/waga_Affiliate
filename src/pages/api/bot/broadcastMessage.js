import dbConnect from '../../../backend/config/dbConnect';
import User from '../../../backend/models/user';
import axios from 'axios';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

const botToken = "7316973369:AAGYzlMkYWSgTobE6w7ETkDXrt0aR_a8YMg";
const telegramApiUrl = `https://api.telegram.org/bot${botToken}`;

const sendTelegramMessage = async (chatId, text, photoPath) => {
  try {
    if (photoPath) {
      const formData = new FormData();
      formData.append('chat_id', chatId);
      formData.append('caption', text);
      formData.append('photo', fs.createReadStream(photoPath));

      await axios.post(`${telegramApiUrl}/sendPhoto`, formData, {
        headers: formData.getHeaders(),
      });
    } else {
      await axios.post(`${telegramApiUrl}/sendMessage`, {
        chat_id: chatId,
        text,
      });
    }
    return true;
  } catch (error) {
    console.error(`Error sending message to ${chatId}:`, error);
    return false;
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
        const users = await User.find({}).select('userId');

        const messageResults = {
          success: [],
          failed: []
        };

        for (const user of users) {
          const success = await sendTelegramMessage(user.userId, message, photoPath);

          // Update user's last message status and date
          const updatedUser = await User.findByIdAndUpdate(user._id, {
            lastMessageStatus: success ? 'success' : 'failed',
            lastMessageDate: new Date(),
          }, { new: true });

          if (updatedUser) {
            console.log(`Updated user ${updatedUser.userId}:`, updatedUser);
          } else {
            console.error(`Failed to update user with ID: ${user._id}`);
          }

          if (success) {
            messageResults.success.push(user.userId);
          } else {
            messageResults.failed.push(user.userId);
          }
        }

        if (photoPath) fs.unlinkSync(photoPath);

        res.status(200).json({
          success: true,
          message: 'Message broadcasted to all users',
          results: messageResults,
        });
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
