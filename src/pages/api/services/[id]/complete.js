import dbConnect from '../../../../backend/config/dbConnect';
import Order from '../../../../backend/models/ServiceOrder';
import User from '../../../../backend/models/user';

export default async function handler(req, res) {
  const { id } = req.query;
  await dbConnect();

  if (req.method === 'PUT') {
    try {
      // Log the id to check if it's correct
      console.log(`Received order id: ${id}`);

      // Check if the order exists before updating
      const order = await Order.findById(id);
      if (!order) {
        console.error(`Order with id ${id} not found`);
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // Update the order's commission and payment status to 'Complete'
      const completedServiceOrder = await Order.findByIdAndUpdate(
        id,
        {
          $set: {
            commissionStatus: 'Complete',
            status: 'Complete',
          },
        },
        { new: true }
      );

      const { userId, totalAmount, commission, points } = completedServiceOrder;

      // Calculate the commission as a percentage of the total amount
      const commissionAmount = totalAmount * (commission / 100);

      // Find the user by userId (assuming it's a string in the database)
       const user = await User.findOne({ userId: userId.toString() }); // Use `findById` to ensure correct match by ObjectId
      if (!user) {
        console.error(`User with id ${userId} not found`);
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Increment user's commission by the calculated amount
      user.commission = (user.commission || 0) + commissionAmount;
      user.points = (user.points|| 0) + points
      await user.save();

      // Respond with the updated order and user commission details
      return res.status(200).json({ 
        success: true, 
        order: completedServiceOrder, 
        commissionAdded: commissionAmount 
      });

    } catch (error) {
      console.error('Error completing the order:', error);
      return res.status(500).json({ success: false, message: 'Failed to complete order due to a server error.' });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
