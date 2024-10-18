import { newOrder, getOrders, getallOrders, getPendingCommissions, getOrdersFromLast30Days,getPendingOrders } from '../../../backend/controllers/orderControllers';
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
        const { all, commissionPending, last30Days, pending } = req.query;  // Added 'last30Days' query param check

        if (commissionPending === 'true') {
          console.log('Fetching orders with pending commissions...');
          await getPendingCommissions(req, res);  // Fetch orders with pending commission status
        } else if (all === 'true') {
          console.log('Fetching all orders...');
          await getallOrders(req, res);  // Fetch all orders for admin
        } else if (last30Days === 'true') {  // Fetch orders from the last 30 days
          console.log('Fetching orders from the last 30 days...');
          await getOrdersFromLast30Days(req, res);  // Implement this controller function
        }else if (pending === 'true') {  // Fetch orders from the last 30 days
          console.log('Fetching orders from the last 30 days...');
          await getPendingOrders(req, res);  // Implement this controller function
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
