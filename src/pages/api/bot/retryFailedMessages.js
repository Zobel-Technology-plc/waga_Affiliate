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

const botToken = "7316973369:AAGYzlMkYWSgTobE6w7ETkDXrt0aR_a8YMg"; // Replace with your actual bot token
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

      let userIds;
      try {
        userIds = JSON.parse(fields.userIds[0]);
      } catch (parseError) {
        console.error('Error parsing userIds:', parseError);
        return res.status(400).json({ success: false, message: 'Invalid user IDs format' });
      }

      const message = Array.isArray(fields.message) ? fields.message[0] : fields.message || '';
      const photoPath = files.image ? files.image.filepath : null;

      try {
        await dbConnect();

        const retryResults = {
          success: [],
          failed: [],
        };

        for (const userId of userIds) {
          const user = await User.findOne({ userId });

          if (!user) {
            console.warn(`User with userId ${userId} not found`);
            retryResults.failed.push(userId);
            continue;
          }

          // Send message and log success/failure
          const success = await sendTelegramMessage(user.userId, message, photoPath);

          // Update lastMessageStatus and lastMessageDate in User document
          await User.findByIdAndUpdate(user._id, {
            lastMessageStatus: success ? 'success' : 'failed',
            lastMessageDate: new Date(),
          }, { new: true });

          if (success) {
            retryResults.success.push(userId);
          } else {
            retryResults.failed.push(userId);
          }
        }

        // Clean up the photo file if it was used
        if (photoPath) {
          fs.unlinkSync(photoPath);
        }

        res.status(200).json({
          success: true,
          message: 'Retry broadcast sent to users with failed status',
          results: retryResults,
        });
      } catch (error) {
        console.error('Error retrying broadcast:', error);
        res.status(500).json({ success: false, message: 'Failed to retry message broadcast' });
      }
    });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
