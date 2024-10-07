// pages/api/services/serviceorder.js
import dbConnect from '../../../backend/config/dbConnect';
import { createServiceOrder, getServiceOrders, getallServiceOrders } from '../../../backend/controllers/serviceOrderController';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    await createServiceOrder(req, res);
  } else if (req.method === 'GET') {
    try {
      const { all } = req.query;  // Check if the 'all' query param is provided (for admin use)
      
      if (all === 'true') {
        console.log('Fetching all orders...');
        if (typeof getallServiceOrders === 'function') {
          await getallServiceOrders(req, res);  // Fetch all orders for admin
        } else {
          console.error('getallServiceOrders is not a function');
          res.status(500).json({ success: false, message: 'getallServiceOrders is not defined' });
        }
      } else {
        console.log('Fetching user-specific orders...');
        await getServiceOrders(req, res);  // Fetch orders for a specific user
      }
      
      console.log('Orders fetched successfully');
    } catch (error) {
      console.error('Error in getOrders handler:', error);
      res.status(500).json({ success: false, message: 'Error fetching orders' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
