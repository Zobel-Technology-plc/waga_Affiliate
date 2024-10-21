import dbConnect from '../../../backend/config/dbConnect';
import Product from '../../../backend/models/product';
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

const uploadMiddleware = upload.array('images', 5); // Allow up to 5 images
const uploadPromise = promisify(uploadMiddleware);

export default async function handler(req, res) {
  await dbConnect();

  switch (req.method) {
    case 'POST':
      return handleCreateProduct(req, res);
    case 'GET':
      const { onSale } = req.query;
      if (onSale === 'true') {
        return handleGetOnsaleProducts(req, res);
      } else {
        return handleGetProducts(req, res);
      }
    default:
      res.setHeader('Allow', ['POST', 'GET']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

// POST handler (create product)
const handleCreateProduct = async (req, res) => {
  try {
    await uploadPromise(req, res);
    const {
      name,
      description,
      price,
      commission,
      category,
      subcategory,
      seller,
      stock,
      onSale,
      freeDelivery,
    } = req.body;
    if (!name || !description || !price || !commission || !category || !subcategory) {
      console.log('Missing required fields:', req.body);
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const images = [];
    for (const file of req.files) {
      const imagePath = file.path;
      const uploadedImage = await uploadImageToCloudinary(imagePath);
      images.push({
        url: uploadedImage.secure_url,
        public_id: uploadedImage.public_id,
      });
    }
    const product = new Product({
      name,
      description,
      price,
      commission,
      category,
      subcategory,
      seller,
      stock,
      freeDelivery,
      onSale,
      images,
    });
    console.log('Product to be saved:', product);
    await product.save();
    return res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({ message: 'Error creating product', error });
  }
};

// GET handler (fetch products)
const handleGetProducts = async (req, res) => {
  try {
    const products = await Product.find();
    return res.status(200).json({ success: true, products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ message: 'Error fetching products', error });
  }
};

// GET handler (fetch on-sale products)
const handleGetOnsaleProducts = async (req, res) => {
  try {
    const products = await Product.find({ onSale: true });
    return res.status(200).json({ success: true, products });
  } catch (error) {
    console.error('Error fetching on-sale products:', error);
    return res.status(500).json({ message: 'Error fetching on-sale products', error });
  }
};

export const config = {
  api: {
    bodyParser: false,
  },
};
