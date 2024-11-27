import dbConnect from '../../../backend/config/dbConnect';
import { getServices, createService } from '../../../backend/controllers/serviceController';
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

// Multer configuration for handling image uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(process.cwd(), 'public', 'assets'));
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
});

const uploadMiddleware = upload.single('image');
const uploadPromise = promisify(uploadMiddleware);

export default async function handler(req, res) {
  await dbConnect();

  switch (req.method) {
    case 'GET':
      try {
        await getServices(req, res);
      } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch services' });
      }
      break;

    case 'POST':
      try {
        await uploadPromise(req, res); // Handle file upload

        // Debugging logs
        console.log('Request Body:', req.body);
        console.log('Uploaded File:', req.file);

        const { name, startingPrice, commission, point } = req.body;

        if (!name || !startingPrice || !req.file || !commission || !point) {
          return res.status(400).json({
            success: false,
            message: 'Missing required fields: name, image, startingPrice, commission, or point',
          });
        }

        // Upload image to Cloudinary
        const uploadedImage = await cloudinary.v2.uploader.upload(req.file.path);
        const imageUrl = uploadedImage.secure_url;

        // Create new service
        await createService({
          body: { name, image: imageUrl, startingPrice, commission, point },
        }, res);
      } catch (error) {
        console.error('Error creating service:', error);
        res.status(500).json({ success: false, message: 'Failed to create service' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
