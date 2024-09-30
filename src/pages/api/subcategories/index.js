import dbConnect from '../../../backend/config/dbConnect';
import Subcategory from '../../../backend/models/Subcategory';

export default async function handler(req, res) {
  await dbConnect();

  switch (req.method) {
    case 'POST':
      return createSubcategory(req, res);
    case 'GET':
      return getSubcategories(req, res);
    default:
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}

// Create a new subcategory
const createSubcategory = async (req, res) => {
  try {
    const { name, image, category } = req.body;

    // Check if subcategory already exists
    const subcategoryExists = await Subcategory.findOne({ name, category });
    if (subcategoryExists) {
      return res.status(400).json({ message: 'Subcategory already exists for this category' });
    }

    // Create and save the subcategory
    const subcategory = new Subcategory({ name, image, category });
    await subcategory.save();

    res.status(201).json({ message: 'Subcategory created successfully', subcategory });
  } catch (error) {
    res.status(500).json({ message: 'Error creating subcategory', error });
  }
};

// Get all subcategories by category that have products
const getSubcategories = async (req, res) => {
  const { category } = req.query;

  try {
    const subcategoriesWithProducts = await Subcategory.aggregate([
      {
        $match: category ? { category } : {} // Filter by category if provided
      },
      {
        $lookup: {
          from: 'products', // Link to the products collection
          localField: 'name',
          foreignField: 'subcategory',
          as: 'products'
        }
      },
      {
        $match: {
          'products.0': { $exists: true } // Only return subcategories that have products
        }
      },
      {
        $project: {
          name: 1,
          image: 1,
          category: 1,
          productCount: { $size: '$products' } // Optional: Include the count of products in each subcategory
        }
      }
    ]);

    if (subcategoriesWithProducts.length === 0) {
      return res.status(404).json({ message: 'No subcategories with products found' });
    }

    res.status(200).json({ success: true, subcategories: subcategoriesWithProducts });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({ message: 'Error fetching subcategories', error });
  }
};