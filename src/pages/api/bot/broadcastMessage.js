import dbConnect from '../../../backend/config/dbConnect';
import User from '../../../backend/models/user';
import axios from 'axios';
import multer from 'multer';
import cloudinary from 'cloudinary';
import { promisify } from 'util';

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dp7u7sr3a",
  api_key: process.env.CLOUDINARY_API_KEY || "759198285855915",
  api_secret: process.env.CLOUDINARY_API_SECRET || "NJ_K5L6nR53f1Vnq8zkyZwZTmk0",
});

// Telegram Bot Configuration
const botToken = "7316973369:AAGYzlMkYWSgTobE6w7ETkDXrt0aR_a8YMg";
const telegramApiUrl = `https://api.telegram.org/bot${botToken}`;

// Helper function to upload image to Cloudinary
const uploadImageToCloudinary = async (filePath) => {
  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader.upload(filePath, { folder: 'telegram_broadcasts' }, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
};

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/assets');  // Temporary storage
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG and PNG are allowed.'));
    }
  },
  limits: { fileSize: 1024 * 1024 * 2 },
});

const uploadMiddleware = upload.single('image');  // Handle a single image upload
const uploadPromise = promisify(uploadMiddleware);

// Send Telegram message with optional image URL
const sendTelegramMessage = async (chatId, text, imageUrl) => {
  try {
    if (imageUrl) {
      await axios.post(`${telegramApiUrl}/sendPhoto`, {
        chat_id: chatId,
        caption: text,
        photo: imageUrl,
      });
    } else {
      await axios.post(`${telegramApiUrl}/sendMessage`, {
        chat_id: chatId,
        text,
      });
    }
    return true;
  } catch (error) {
    console.error(`Error sending message to ${chatId}:`, error.response ? error.response.data : error);
    return false;
  }
};

// API Handler
export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    try {
      // Use multer to handle the file upload
      await uploadPromise(req, res);

      const { message } = req.body;
      let imageUrl = null;

      // If an image is provided, upload it to Cloudinary
      if (req.file && req.file.path) {
        try {
          const uploadResult = await uploadImageToCloudinary(req.file.path);
          imageUrl = uploadResult.secure_url;
          console.log('Image uploaded to Cloudinary:', imageUrl);
        } catch (uploadError) {
          console.error('Error uploading image to Cloudinary:', uploadError);
          return res.status(500).json({ success: false, message: 'Image upload failed' });
        }
      }

      const users = await User.find({}).select('userId');

      const messageResults = {
        success: [],
        failed: []
      };

      for (const user of users) {
        const success = await sendTelegramMessage(user.userId, message, imageUrl);

        // Update user's last message status and date
        await User.findByIdAndUpdate(user._id, {
          lastMessageStatus: success ? 'success' : 'failed',
          lastMessageDate: new Date(),
        }, { new: true });

        if (success) {
          messageResults.success.push(user.userId);
        } else {
          messageResults.failed.push(user.userId);
        }
      }

      res.status(200).json({
        success: true,
        message: 'Message broadcasted to all users',
        results: messageResults,
      });
    } catch (error) {
      console.error('Error broadcasting message:', error);
      res.status(500).json({ success: false, message: 'Failed to broadcast message' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export const config = {
  api: {
    bodyParser: false,  // Use Multer for parsing form data
  },
};
