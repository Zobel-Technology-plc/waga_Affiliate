import dbConnect from '../../../backend/config/dbConnect';
import { createServiceOrder, getServiceOrders, getallServiceOrders, getPendingStatus, getServiceOrdersFromLast30Days, getpendingServiceOrders } from '../../../backend/controllers/serviceOrderController';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    await createServiceOrder(req, res);
  } else if (req.method === 'GET') {
    try {
      const { all, status, last30Days , pending} = req.query;  // Added 'last30Days' query param check

      if (all === 'true') {
        console.log('Fetching all orders...');
        if (typeof getallServiceOrders === 'function') {
          await getallServiceOrders(req, res);  // Fetch all orders for admin
        } else {
          console.error('getallServiceOrders is not a function');
          res.status(500).json({ success: false, message: 'getallServiceOrders is not defined' });
        }
      } else if (status === 'true') {  // Fetch services with pending status
        console.log('Fetching services with pending status...');
        await getPendingStatus(req, res);
      } else if (last30Days === 'true') {  // Fetch service orders from the last 30 days
        console.log('Fetching service orders from the last 30 days...');
        await getServiceOrdersFromLast30Days(req, res);  // Implement this controller function
      }else if (pending === 'true') {  // Fetch services with pending status
        console.log('Fetching services with pending status...');
        await getpendingServiceOrders(req, res);
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
