import dbConnect from '../../../backend/config/dbConnect';
import Subcategory from '../../../backend/models/Subcategory';
import multer from 'multer';
import path from 'path';
import { promisify } from 'util';
import cloudinary from 'cloudinary';

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

const handler = async (req, res) => {
  await dbConnect();

  switch (req.method) {
    case 'POST':
      return handleCreateSubcategory(req, res);
    case 'GET':
      try {
        const { all } = req.query;  
        
        if (all === 'true') {
          console.log('Fetching all SubCategories...');
          await handleGetAllSubcategories(req, res);
        } else {
          console.log('Fetching SubCategories...');
          await handleGetSubcategories(req, res); 
        }
        
        console.log('Orders fetched successfully');
      } catch (error) {
        console.error('Error in handleGetAllSubcategories handler:', error);
        res.status(500).json({ success: false, message: 'Error fetching subcategory' });
      }
      break;
    default:
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
};

const handleCreateSubcategory = async (req, res) => {
  try {
    await uploadPromise(req, res);

    const { name, category } = req.body;
    if (!name || !category || !req.file) {
      console.log('Missing required fields:', { name, category, file: !!req.file });
      return res.status(400).json({ message: 'Name, category, and image are required.' });
    }

    const imagePath = req.file.path;
    const uploadedImage = await uploadImageToCloudinary(imagePath);

    const subcategory = new Subcategory({
      name,
      image: {
        url: uploadedImage.secure_url,
        public_id: uploadedImage.public_id,
      },
      category,
    });

    console.log('Subcategory to be saved:', subcategory);

    await subcategory.save();

    return res.status(201).json({ message: 'Subcategory created successfully', subcategory });
  } catch (error) {
    console.error('Error creating subcategory:', error);
    return res.status(500).json({ message: 'Error creating subcategory', error });
  }
};


const handleGetSubcategories = async (req, res) => {
  const { category } = req.query;

  try {
    const subcategoriesWithProducts = await Subcategory.aggregate([
      { $match: category ? { category } : {} },
      {
        $lookup: {
          from: 'products',
          localField: 'name',
          foreignField: 'subcategory',
          as: 'products',
        },
      },
      { $match: { 'products.0': { $exists: true } } },
      { $project: { name: 1, image: 1, category: 1, productCount: { $size: '$products' } } },
    ]);

    if (subcategoriesWithProducts.length === 0) {
      return res.status(404).json({ message: 'No subcategories with products found.' });
    }

    return res.status(200).json({ success: true, subcategories: subcategoriesWithProducts });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return res.status(500).json({ message: 'Error fetching subcategories', error });
  }
};


const handleGetAllSubcategories = async (req, res) => {
  const { category } = req.query;
  try {
    const subcategories = await Subcategory.aggregate([
      { $match: category ? { category } : {} },
      {
        $lookup: {
          from: 'products',
          localField: 'name',
          foreignField: 'subcategory',
          as: 'products',
        },
      },
    ]);

    if (subcategories.length === 0) {
      return res.status(404).json({ message: 'No subcategories with products found.' });
    }

    return res.status(200).json({ success: true, subcategories: subcategories });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return res.status(500).json({ message: 'Error fetching subcategories', error });
  }
};

export default handler;

export const config = {
  api: {
    bodyParser: false,
  },
};
