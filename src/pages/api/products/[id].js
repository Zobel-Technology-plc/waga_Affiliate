// pages/api/products/[id].js

import dbConnect from '../../../backend/config/dbConnect';
import {
  getProduct,
  updateProduct,
  deleteProduct,
} from '../../../backend/controllers/productControllers';

export default async function handler(req, res) {
  await dbConnect();

  const { method } = req;

  switch (method) {
    case 'GET':
      // Get a single product by ID
      await getProduct(req, res);
      break;
    
    case 'PUT':
      // Update a product by ID
      await updateProduct(req, res);
      break;

    case 'DELETE':
      // Delete a product by ID
      await deleteProduct(req, res);
      break;

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
      break;
  }
}
