// api/products/category.js
import dbConnect from '../../../backend/config/dbConnect';
import Product from '../../../backend/models/product';

export const getProductsByCategoryAndSubcategory = async (category, subcategory) => {
  try {
    await dbConnect();

    const products = await Product.find({
      category,  // Now category is a string
      subcategory,
    });

    if (!products || products.length === 0) {
      return { success: false, message: 'No products found', products: [] };
    }

    return { success: true, products };
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
    const { category, subcategory } = req.query;
    const result = await getProductsByCategoryAndSubcategory(category, subcategory);

    return res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error('Error handling request:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
}
