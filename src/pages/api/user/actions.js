import dbConnect from '../../../backend/config/dbConnect';
import User from '../../../backend/models/user';
import UserAction from '../../../backend/models/useraction'; // Import the UserAction model

export default async function handler(req, res) {
  // Log the type of request and request body if available
  console.log(`Request received - Method: ${req.method}, Body: ${JSON.stringify(req.body)}`);

  // Connect to the database
  await dbConnect();
  console.log("Database connected");

  // Handle POST request (for creating actions)
  if (req.method === 'POST') {
    const { actionType, userId, joinerUserId, points } = req.body;

    // Ensure we have the required fields for any action
    if (!userId || !actionType) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    try {
      // Handle different types of actions
      switch (actionType) {
        case 'invite':
          // Handle user invite actions (from bot invite logic)
          if (!joinerUserId) {
            return res.status(400).json({ success: false, message: 'Missing joinerUserId for invite action' });
          }

          const user = await User.findOne({ userId });

          // Check if the invited user has already joined via invite or is already a member
          if (user && (user.hasJoinedViaInvite || user.phoneNumber)) {
            return res.status(200).json({
              success: false,
              message: 'User is already a member or has already joined via invite',
            });
          }

          // Mark the invited user as having joined via the invite
          await User.findOneAndUpdate(
            { userId: joinerUserId },
            { hasJoinedViaInvite: true }, // Mark user as having joined via invite
            { new: true }
          );

          // Update inviter's points and log the action
          const inviter = await User.findOneAndUpdate(
            { userId },
            { $inc: { points: points || 50000 } }, // Increment points for inviter
            { new: true }
          );

          // Save the invite action in UserAction model
          const inviteAction = new UserAction({
            userId, // The inviter's userId
            action: `Invited user ${joinerUserId}`, // Action description
            points: points || 50000, // Default points if not provided
            joinerUserId, // Track the user who joined
            timestamp: new Date(),
          });
          await inviteAction.save();

          return res.status(200).json({
            success: true,
            message: 'Invite action recorded successfully, points awarded',
            points: points || 50000,
          });

        case 'earn':
          // Handle earning points (from earn page)
          const earnUser = await User.findOneAndUpdate(
            { userId },
            { $inc: { points: points || 0 } }, // Increment points based on request
            { new: true, upsert: true } // Create user if not exists
          );

          // Save the earning action in UserAction model with the correct action name
          const earnAction = new UserAction({
            userId,
            action: req.body.action || 'Earned points', // Default action if not provided
            points: points || 0, // Points earned
            timestamp: new Date(),
          });
          await earnAction.save();

          return res.status(200).json({
            success: true,
            message: 'Points earned successfully',
            points: points || 0,
          });

        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid action type',
          });
      }
    } catch (error) {
      console.error('Error handling user action:', error);
      return res.status(500).json({ success: false, message: 'Failed to handle user action' });
    }
  } 
  
  // Handle GET request (for retrieving actions)
  else if (req.method === 'GET') {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'Missing userId in request' });
    }

    try {
      const userActions = await UserAction.find({ userId: userId.toString() }).select('action points joinerUserId -_id');

      if (!userActions || userActions.length === 0) {
        return res.status(404).json({ success: false, message: 'No actions found for this user' });
      }

      return res.status(200).json({
        success: true,
        actions: userActions.map(action => ({
          action: action.action,
          points: action.points,
          joinerUserId: action.joinerUserId,
        }))
      });
    } catch (error) {
      console.error('Error fetching user actions:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch user actions' });
    }
  }
  
  // Handle unsupported methods
  else {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }
}
