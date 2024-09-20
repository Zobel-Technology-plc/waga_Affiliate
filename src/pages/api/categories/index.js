import dbConnect from '../../../backend/config/dbConnect';
import Category from '../../../backend/models/Category';

export default async function handler(req, res) {
  await dbConnect();

  switch (req.method) {
    case 'POST':
      return createCategory(req, res);
    case 'GET':
      return getCategories(req, res);
    default:
      return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }
}

// Create a new category
const createCategory = async (req, res) => {
  try {
    const { name, image } = req.body;

    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = new Category({ name, image });
    await category.save();

    res.status(201).json({ message: 'Category created successfully', category });
  } catch (error) {
    res.status(500).json({ message: 'Error creating category', error });
  }
};

// Get all categories with filtering and pagination
const getCategories = async (req, res) => {
  try {
    const { page = 1, limit = 9, min, max, category, ratings } = req.query;

    // Build the query object for filtering
    let query = {};

    // If category filter is applied
    if (category) {
      query.name = category;
    }

    // If ratings filter is applied
    if (ratings) {
      query.ratings = { $gte: Number(ratings) };
    }

    // If price range filter is applied
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
    res.status(500).json({ message: 'Error fetching categories', error });
  }
};
