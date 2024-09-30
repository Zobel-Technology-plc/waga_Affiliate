import dbConnect from '../../../backend/config/dbConnect';
import User from '../../../backend/models/user'; // Assuming you have a User model
import UserAction from '../../../backend/models/useraction';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    try {
      const { userId, action, points } = req.body;

      // Save the action to the database
      const newAction = new UserAction({
        userId,
        action,
        points,
        joinerName: joinerName || null,
        timestamp: new Date(),
      });

      await newAction.save();

      // Update the user's total points
      const user = await User.findOne({ userId });
      if (user) {
        user.points = (user.points || 0) + points;
        await user.save();
      } else {
        // If user doesn't exist, create a new one with points
        await User.create({ userId, points });
      }

      res.status(200).json({ message: 'Action saved successfully!' });
    } catch (error) {
      console.error('Error saving action:', error.message);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } else if (req.method === 'GET') {
    try {
      const { userId } = req.query;

      // Fetch user points
      const user = await User.findOne({ userId });

      if (user) {
        // Fetch all actions performed by this user
        const actions = await UserAction.find({ userId }).select('action -_id');
        const completedActions = actions.map((action) => action.action);

        res.status(200).json({ points: user.points, completedActions });
      } else {
        res.status(404).json({ points: 0, completedActions: [] });
      }
    } catch (error) {
      console.error('Error fetching points:', error.message);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
