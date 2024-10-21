import dbConnect from '../../../backend/config/dbConnect';
import Category from '../../../backend/models/Category';
import multer from 'multer';
import path from 'path';
import cloudinary from 'cloudinary';
import { promisify } from 'util';

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dp7u7sr3a",
  api_key: process.env.CLOUDINARY_API_KEY || "759198285855915",
  api_secret: process.env.CLOUDINARY_API_SECRET || "NJ_K5L6nR53f1Vnq8zkyZwZTmk0",
});

// Function to upload image to Cloudinary
const uploadImageToCloudinary = async (filePath) => {
  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader.upload(filePath, (error, result) => {
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
      cb(null, path.join(process.cwd(), 'public', 'assets', 'icons'));
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

const uploadMiddleware = upload.single('image');
const uploadPromise = promisify(uploadMiddleware);

export default async function handler(req, res) {
  await dbConnect();

  switch (req.method) {
    case 'POST':
      return handleCreateCategory(req, res);
    case 'GET':
      return handleGetCategories(req, res);
    default:
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}

// Create a new category with image upload
const handleCreateCategory = async (req, res) => {
  try {
    await uploadPromise(req, res);

    const { name } = req.body;
    if (!name || !req.file) {
      return res.status(400).json({ message: 'Name and image are required.' });
    }

    // Check if category already exists
    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    // Upload image to Cloudinary
    const imagePath = req.file.path;
    const uploadedImage = await uploadImageToCloudinary(imagePath);

    // Create new category with the uploaded image
    const category = new Category({
      name,
      image: {
        url: uploadedImage.secure_url,
        public_id: uploadedImage.public_id,
      },
    });

    await category.save();

    return res.status(201).json({ message: 'Category created successfully', category });
  } catch (error) {
    console.error('Error creating category:', error);
    return res.status(500).json({ message: 'Error creating category', error });
  }
};

// Get all categories with filtering and pagination
const handleGetCategories = async (req, res) => {
  try {
    const { page = 1, limit = 9, min, max, category, ratings } = req.query;

    // Build the query object for filtering
    let query = {};

    // Apply category filter if provided
    if (category) {
      query.name = category;
    }

    // Apply ratings filter if provided
    if (ratings) {
      query.ratings = { $gte: Number(ratings) };
    }

    // Apply price range filter if provided
    if (min || max) {
      query.price = {};
      if (min) query.price.$gte = Number(min);
      if (max) query.price.$lte = Number(max);
    }

    // Calculate skip and limit for pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Fetch categories with applied filters and pagination
    const categories = await Category.find(query)
      .skip(skip)
      .limit(Number(limit));

    // Get the total number of categories for pagination
    const totalCategoriesCount = await Category.countDocuments(query);

    res.status(200).json({
      success: true,
      categories,
      totalCategoriesCount,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories', error });
  }
};

// Disable automatic body parsing by Next.js for image upload
export const config = {
  api: {
    bodyParser: false,
  },
};
