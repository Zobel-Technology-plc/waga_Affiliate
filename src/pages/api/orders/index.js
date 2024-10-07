// src/pages/api/orders/index.js

import { newOrder, getOrders, getallOrders } from '../../../backend/controllers/orderControllers';
import dbConnect from '../../../backend/config/dbConnect';

export default async function handler(req, res) {
  try {
    await dbConnect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({ success: false, message: 'Database connection failed' });
  }

  switch (req.method) {
    case 'POST':
      try {
        await newOrder(req, res);
        console.log('Order created successfully');
      } catch (error) {
        console.error('Error in newOrder handler:', error);
        res.status(500).json({ success: false, message: 'Error creating order' });
      }
      break;

    case 'GET':
      try {
        const { all } = req.query;  // Check if the 'all' query param is provided (for admin use)
        
        if (all === 'true') {
          console.log('Fetching all orders...');
          await getallOrders(req, res);  // Fetch all orders for admin
        } else {
          console.log('Fetching user-specific orders...');
          await getOrders(req, res);  // Fetch orders for a specific user
        }
        
        console.log('Orders fetched successfully');
      } catch (error) {
        console.error('Error in getOrders handler:', error);
        res.status(500).json({ success: false, message: 'Error fetching orders' });
      }
      break;

    default:
      res.setHeader('Allow', ['POST', 'GET']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
