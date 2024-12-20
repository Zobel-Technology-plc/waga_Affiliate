import {
  newOrder,
  getOrders,
  getallOrders,
  getPendingCommissions,
  getOrdersFromLast30Days,
  getPendingOrders,
  getCompletedCommissions,
  getCanceledOrders, // New function
} from '../../../backend/controllers/orderControllers';
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
        const { all, commissionPending, last30Days, pending, commissionComplete, canceled } = req.query;

        if (commissionPending === 'true') {
          console.log('Fetching orders with pending commissions...');
          await getPendingCommissions(req, res);
        } else if (all === 'true') {
          console.log('Fetching all orders...');
          await getallOrders(req, res);
        } else if (last30Days === 'true') {
          console.log('Fetching orders from the last 30 days...');
          await getOrdersFromLast30Days(req, res);
        } else if (pending === 'true') {
          console.log('Fetching pending orders...');
          await getPendingOrders(req, res);
        } else if (commissionComplete === 'true') {
          console.log('Fetching orders with completed commissions...');
          await getCompletedCommissions(req, res);
        } else if (canceled === 'true') {
          console.log('Fetching canceled orders...');
          await getCanceledOrders(req, res); // New handler for canceled orders
        } else {
          console.log('Fetching user-specific orders...');
          await getOrders(req, res);
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
