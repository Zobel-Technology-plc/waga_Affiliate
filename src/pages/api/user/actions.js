import dbConnect from '../../../backend/config/dbConnect';
import User from '../../../backend/models/user';
import UserAction from '../../../backend/models/useraction';

export default async function handler(req, res) {
  console.log(`Request received - Method: ${req.method}, Body: ${JSON.stringify(req.body)}`);

  await dbConnect();
  console.log('Database connected');

  if (req.method === 'POST') {
    const { actionType, userId, joinerUserId, points } = req.body;

    if (!userId || !actionType) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    try {
      switch (actionType) {
        case 'invite': {
          if (!joinerUserId) {
            return res.status(400).json({ success: false, message: 'Missing joinerUserId for invite action' });
          }

          const user = await User.findOne({ userId });

          if (user && (user.hasJoinedViaInvite || user.phoneNumber)) {
            return res.status(200).json({
              success: false,
              message: 'User is already a member or has already joined via invite',
            });
          }

          await User.findOneAndUpdate(
            { userId: joinerUserId },
            { hasJoinedViaInvite: true },
            { new: true }
          );

          const inviter = await User.findOneAndUpdate(
            { userId },
            { $inc: { points: points || 50000 } },
            { new: true }
          );

          const inviteAction = new UserAction({
            userId,
            action: `Invited user ${joinerUserId}`,
            points: points || 50000,
            joinerUserId,
            timestamp: new Date(),
          });
          await inviteAction.save();

          return res.status(200).json({
            success: true,
            message: 'Invite action recorded successfully, points awarded',
            points: inviter.points,
          });
        }

        case 'earn': {
          const earnUser = await User.findOneAndUpdate(
            { userId },
            { $inc: { points: points || 0 } },
            { new: true, upsert: true }
          );

          const earnAction = new UserAction({
            userId,
            action: req.body.action || 'Earned points',
            points: points || 0,
            timestamp: new Date(),
          });
          await earnAction.save();

          return res.status(200).json({
            success: true,
            message: 'Points earned successfully',
            points: earnUser.points,
          });
        }

        default:
          return res.status(400).json({ success: false, message: 'Invalid action type' });
      }
    } catch (error) {
      console.error('Error handling user action:', error);
      return res.status(500).json({ success: false, message: 'Failed to handle user action' });
    }
  } else if (req.method === 'GET') {
    const { userId, actionName } = req.query;

    try {
      if (userId) {
        // Fetch user's total points
        const user = await User.findOne({ userId }).select('points');
        if (!user) {
          return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Fetch all actions for a specific user
        const userActions = await UserAction.find({ userId })
          .select('action points joinerUserId -_id');

        return res.status(200).json({
          success: true,
          actions: userActions,
          points: user.points
        });
      } else if (actionName) {
        // Fetch all users who performed a specific action
        const filter =
          actionName === 'Invite Your Friend'
            ? { action: { $regex: '^Invited', $options: 'i' } }
            : { action: actionName };

        const actionRecords = await UserAction.find(filter)
          .select('action userId points -_id');

        return res.status(200).json({
          success: true,
          actions: actionRecords.map((record) => ({
            userId: record.userId,
            points: record.points,
            action: record.action,
          }))
        });
      } else {
        return res.status(400).json({ success: false, message: 'Missing userId or actionName in request' });
      }
    } catch (error) {
      console.error('Error fetching user actions:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch user actions' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
