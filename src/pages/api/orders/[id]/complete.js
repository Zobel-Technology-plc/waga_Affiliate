import dbConnect from '../../../../backend/config/dbConnect';
import Order from '../../../../backend/models/order';
import User from '../../../../backend/models/user';

export default async function handler(req, res) {
  const { id } = req.query; // This is the orderId
  await dbConnect();

  if (req.method === 'PUT') {
    const { userId, commissionAmount } = req.body; // Get userId and commissionAmount from the request body

    try {
      // Update the order's commissionStatus and paymentStatus
      const completedOrder = await Order.findByIdAndUpdate(
        id,
        {
          $set: {
            commissionStatus: 'Complete',
            paymentStatus: 'Complete',
          },
        },
        { new: true }
      );

      if (!completedOrder) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // Find the user and update their commission
      // Adjust this query depending on whether userId is stored as a string or ObjectId in your DB
      const user = await User.findOne({ userId: userId.toString() }); // Assuming userId is stored as a string in DB
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      user.commission += commissionAmount; // Increment user's commission
      await user.save(); // Save the updated user data

      // Send back the updated order and user information
      res.status(200).json({ success: true, order: completedOrder, user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Failed to complete order and update user commission' });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
