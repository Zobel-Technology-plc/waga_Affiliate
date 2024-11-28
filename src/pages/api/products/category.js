import dbConnect from '../../../backend/config/dbConnect';
import Product from '../../../backend/models/product';

// Function to fetch products with pagination
export const getProductsByCategoryAndSubcategory = async (category, subcategory, page, limit) => {
  try {
    await dbConnect();

    // Convert page and limit to integers and set defaults
    const currentPage = parseInt(page, 10) || 1;
    const perPage = parseInt(limit, 10) || 10;

    // Build the query
    const query = {
      category,
      subcategory,
      $or: [
        { status: 'approved' },
        { status: { $exists: false } }, // Include products without a status
      ],
    };

    // Fetch total product count and paginated products
    const totalProducts = await Product.countDocuments(query);
    const products = await Product.find(query)
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    return { success: true, products, totalProducts, currentPage, totalPages: Math.ceil(totalProducts / perPage) };
  } catch (error) {
    console.error('Error fetching products:', error);
    return { success: false, message: 'Server Error', products: [] };
  }
};

// API route handler
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { category, subcategory, page, limit } = req.query;
    const result = await getProductsByCategoryAndSubcategory(category, subcategory, page, limit);

    return res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error('Error handling request:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
}
