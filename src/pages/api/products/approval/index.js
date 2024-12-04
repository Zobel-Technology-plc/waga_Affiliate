import dbConnect from '../../../../backend/config/dbConnect';
import Product from '../../../../backend/models/product';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const products = await Product.find({ status: 'pending' });
      res.status(200).json({ success: true, products });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch pending products.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
