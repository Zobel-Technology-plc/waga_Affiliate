import dbConnect from '../../../backend/config/dbConnect';
import User from '../../../backend/models/user';
import ConversionRecord from '../../../backend/models/conversionRecord';
import UserAction from '../../../backend/models/useraction';

const auditUserPoints = async (userId) => {
  // Fetch all user actions and calculate valid points
  const userActions = await UserAction.find({ userId }).sort({ timestamp: 1 });

  // Remove duplicates and calculate total valid points
  const seenActions = new Set();
  const validPoints = userActions.reduce((total, action) => {
    if (!seenActions.has(action.action)) {
      seenActions.add(action.action);
      return total + (action.points || 0);
    }
    return total; // Skip duplicate actions
  }, 0);

  // Fetch user's points
  const user = await User.findOne({ userId });

  if (!user) {
    throw new Error('User not found');
  }

  // Check for discrepancies
  if (user.points > validPoints) {
    user.points = validPoints; // Correct the points
    await user.save(); // Save the updated points
  }

  return user.points;
};

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    const { userId, birrEquivalent, pointsUsed } = req.body;

    if (!userId || birrEquivalent == null || pointsUsed == null) {
      return res.status(400).json({ success: false, message: 'Invalid data provided' });
    }

    try {
      const auditedPoints = await auditUserPoints(userId); // Validate and adjust points

      if (auditedPoints < pointsUsed) {
        return res.status(400).json({ success: false, message: 'Insufficient valid points after audit.' });
      }

      const user = await User.findOne({ userId });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      console.log(`Before deduction: user.points = ${user.points}, pointsUsed = ${pointsUsed}`);

      // Deduct points safely
      user.points = Math.max(0, user.points - pointsUsed);
      await user.save();

      console.log(`After deduction: user.points = ${user.points}`);

      // Create a new conversion record
      const conversionRecord = new ConversionRecord({
        userId,
        pointsUsed,
        birrEquivalent,
        status: 'pending',
      });

      await conversionRecord.save();

      return res.status(200).json({
        success: true,
        message: `Conversion request for ${pointsUsed} points to ${birrEquivalent} birr has been submitted for approval.`,
      });
    } catch (error) {
      console.error('Error during conversion:', error.message);
      return res.status(500).json({ success: false, message: 'Conversion failed' });
    }
  } else if (req.method === 'GET') {
    const { userId } = req.query;

    try {
      const conversionRecords = userId
        ? await ConversionRecord.find({ userId })
        : await ConversionRecord.find();

      if (!conversionRecords.length) {
        return res.status(404).json({ success: false, message: 'No conversion records found' });
      }

      return res.status(200).json({
        success: true,
        data: conversionRecords,
      });
    } catch (error) {
      console.error('Error fetching conversion records:', error.message);
      return res.status(500).json({ success: false, message: 'Failed to fetch conversion records' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }
}

