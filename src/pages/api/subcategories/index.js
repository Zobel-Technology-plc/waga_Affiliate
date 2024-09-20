// api/subcategories/index.js
import dbConnect from '../../../backend/config/dbConnect';
import Subcategory from '../../../backend/models/subcategory';

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

// Get all subcategories by category
const getSubcategories = async (req, res) => {
  const { category } = req.query;
  console.log('Querying subcategories for category:', category);

  try {
    const subcategories = await Subcategory.find(category ? { category } : {});
    console.log('Found subcategories:', subcategories);
    
    if (subcategories.length === 0) {
      return res.status(404).json({ message: 'No subcategories found' });
    }

    res.status(200).json({ success: true, subcategories });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({ message: 'Error fetching subcategories', error });
  }
};

