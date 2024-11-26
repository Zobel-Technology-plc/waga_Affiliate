import dbConnect from '../../backend/config/dbConnect';
import UserAction from '../../backend/models/useraction';
import ConversionRecord from '../../backend/models/conversionRecord';
import User from '../../backend/models/user';
import mongoose from 'mongoose';

// Audited Users Schema
const AuditedUserSchema = new mongoose.Schema({
  userId: { type: String, unique: true, required: true },
  auditedAt: { type: Date, default: Date.now },
});

const AuditedUser = mongoose.models.AuditedUser || mongoose.model('AuditedUser', AuditedUserSchema);

export default async function handler(req, res) {
  try {
    await dbConnect();

    if (req.method !== 'DELETE') {
      res.setHeader('Allow', ['DELETE']);
      return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
    }

    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'Missing userId in request' });
    }

    // Check if the user has already been audited within the last 2 hours
    const alreadyAudited = await AuditedUser.findOne({ userId });
    if (alreadyAudited) {
      const now = new Date();
      const auditTimeDiff = (now - new Date(alreadyAudited.auditedAt)) / (1000 * 60 * 60); // Difference in hours

      if (auditTimeDiff < 2) {
        return res.status(200).json({ success: true, message: `User ${userId} has already been audited within the last 2 hours.` });
      }
    }

    // Fetch the user
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Fetch conversion records for the user
    const conversionRecords = await ConversionRecord.find({ userId });
    const convertedPoints = conversionRecords.reduce((sum, record) => sum + record.pointsUsed, 0);

    // Fetch and sort user actions by timestamp
    const userActions = await UserAction.find({ userId }).sort({ timestamp: 1 });

    const seenActions = new Set();
    const duplicates = [];
    let duplicatePoints = 0;

    let totalPointsToAudit = userActions.reduce((sum, action) => sum + (action.points || 0), 0);

    if (totalPointsToAudit <= convertedPoints) {
      console.log(`Skipping audit for user ${userId}, all points converted.`);
      await AuditedUser.create({ userId });
      return res.status(200).json({
        success: true,
        message: `User ${userId} has no points left to audit. All points have been converted.`,
      });
    }

    let remainingPoints = totalPointsToAudit - convertedPoints;

    userActions.forEach((action) => {
      if (remainingPoints <= 0) return; // No more points to process

      if (seenActions.has(action.action)) {
        duplicates.push(action._id); // Track duplicate IDs
        duplicatePoints += action.points || 0; // Sum points of duplicate actions
      } else {
        seenActions.add(action.action); // Mark first occurrence
        remainingPoints -= action.points || 0;
      }
    });

    // Remove duplicate actions for this user
    let totalDuplicatesRemoved = 0;
    if (duplicates.length > 0) {
      const result = await UserAction.deleteMany({ _id: { $in: duplicates } });
      totalDuplicatesRemoved = result.deletedCount;
    }

    // Deduct duplicate points from user's points
    user.points = Math.max(0, user.points - duplicatePoints); // Ensure points are not negative
    await user.save();

    // Update the audit timestamp for this user
    try {
      if (alreadyAudited) {
        alreadyAudited.auditedAt = new Date();
        await alreadyAudited.save();
      } else {
        await AuditedUser.create({ userId });
      }
    } catch (err) {
      if (err.code !== 11000) { // Ignore duplicate key errors
        console.error(`Error marking user ${userId} as audited:`, err.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Audit complete for user ${userId}. Removed ${totalDuplicatesRemoved} duplicate actions and deducted ${duplicatePoints} points.`,
    });
  } catch (error) {
    console.error('Error auditing user actions:', error.message);
    return res.status(500).json({
      success: false,
      message: `Failed to audit user ${req.query.userId}'s actions.`,
    });
  }
}
