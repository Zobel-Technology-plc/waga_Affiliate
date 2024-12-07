import dbConnect from '../../../backend/config/dbConnect';
import EarnOption from '../../../backend/models/earnoptions';
import multer from 'multer';
import path from 'path';
import { promisify } from 'util';
import cloudinary from 'cloudinary';

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dp7u7sr3a',
  api_key: process.env.CLOUDINARY_API_KEY || '759198285855915',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'NJ_K5L6nR53f1Vnq8zkyZwZTmk0',
});

// Multer configuration for handling file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: '/tmp',
    filename: function (req, file, cb) {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    },
  }),
  fileFilter: function (req, file, cb) {
    // Accept only PNG files for icons and PNG/JPEG for story images
    if (file.fieldname === 'icon') {
      if (file.mimetype === 'image/png') {
        cb(null, true);
      } else {
        cb(new Error('Only PNG files are allowed for icons!'), false);
      }
    } else if (file.fieldname === 'image') {
      if (file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
        cb(null, true);
      } else {
        cb(new Error('Only PNG and JPEG files are allowed for story images!'), false);
      }
    }
  },
});

const uploadMiddleware = upload.fields([
  { name: 'icon', maxCount: 1 },
  { name: 'image', maxCount: 1 },
]);
const uploadPromise = promisify(uploadMiddleware);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  await dbConnect();

  switch (req.method) {
    case 'GET':
      try {
        const options = await EarnOption.find();
        res.status(200).json({ success: true, data: options });
      } catch (error) {
        console.error('Error fetching earn options:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch earn options' });
      }
      break;

    case 'POST':
      try {
        await uploadPromise(req, res);

        const { text, points, link, requiresCheck, description } = req.body;

        // Validate required fields
        if (!text || !points) {
          return res.status(400).json({
            success: false,
            message: 'Missing required fields: text, points',
          });
        }

        // Additional validation for "Share to Stories"
        if (text === 'Share to Stories' && (!req.files.image || !description)) {
          return res.status(400).json({
            success: false,
            message: 'Missing required fields for "Share to Stories": image, description',
          });
        }

        // Upload icon to Cloudinary
        let iconUrl = '';
        if (req.files.icon && req.files.icon[0]) {
          const uploadedIcon = await cloudinary.v2.uploader.upload(req.files.icon[0].path);
          iconUrl = uploadedIcon.secure_url;
        }

        // Upload story image to Cloudinary if present
        let imageUrl = '';
        if (req.files.image && req.files.image[0]) {
          const uploadedImage = await cloudinary.v2.uploader.upload(req.files.image[0].path);
          imageUrl = uploadedImage.secure_url;
        }

        // Create a new earn option
        const newOption = await EarnOption.create({
          text,
          points,
          icon: iconUrl,
          link: link || '',
          requiresCheck: requiresCheck === 'true',
          image: imageUrl || null,
          description: description || null,
        });

        res.status(201).json({ success: true, data: newOption });
      } catch (error) {
        console.error('Error creating earn option:', error);
        res.status(500).json({ 
          success: false, 
          message: error.message || 'Failed to create earn option'
        });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
