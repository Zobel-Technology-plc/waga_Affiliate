import dbConnect from '../../backend/config/dbConnect';
import UserAction from '../../backend/models/useraction';
import ConversionRecord from '../../backend/models/conversionRecord';
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

    // Step 1: Fetch all distinct user IDs
    const allUserIds = await UserAction.distinct('userId');

    // Step 2: Fetch already audited user IDs
    const auditedUserIds = await AuditedUser.distinct('userId');

    // Step 3: Identify users needing audit
    const usersToAudit = allUserIds.filter(userId => !auditedUserIds.includes(userId));

    let totalDuplicatesRemoved = 0;

    // Process users in batches
    const batchSize = 50;
    for (let i = 0; i < usersToAudit.length; i += batchSize) {
      const batch = usersToAudit.slice(i, i + batchSize);

      for (const userId of batch) {
        // Fetch conversion records for the user
        const conversionRecords = await ConversionRecord.find({ userId });
        const convertedPoints = conversionRecords.reduce((sum, record) => sum + record.pointsUsed, 0);

        // Fetch and sort actions by timestamp
        const userActions = await UserAction.find({ userId }).sort({ timestamp: 1 });

        const seenActions = new Set();
        const duplicates = [];

        let totalPointsToAudit = userActions.reduce((sum, action) => sum + (action.points || 0), 0);

        if (totalPointsToAudit <= convertedPoints) {
          console.log(`Skipping audit for user ${userId}, all points converted.`);
          await AuditedUser.create({ userId });
          continue; // Skip if all points have been converted
        }

        let remainingPoints = totalPointsToAudit - convertedPoints;

        userActions.forEach((action) => {
          if (remainingPoints <= 0) return; // No more points to process

          if (seenActions.has(action.action)) {
            duplicates.push(action._id); // Track duplicate IDs
          } else {
            seenActions.add(action.action); // Mark first occurrence
            remainingPoints -= action.points || 0;
          }
        });

        // Remove duplicate actions for this user
        if (duplicates.length > 0) {
          await UserAction.deleteMany({ _id: { $in: duplicates } });
          totalDuplicatesRemoved += duplicates.length;
        }

        // Mark this user as audited
        try {
          await AuditedUser.create({ userId });
        } catch (err) {
          if (err.code !== 11000) { // Ignore duplicate key errors
            console.error(`Error marking user ${userId} as audited:`, err.message);
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: `Audit complete. Removed ${totalDuplicatesRemoved} duplicate actions across ${usersToAudit.length} users.`,
    });
  } catch (error) {
    console.error('Error auditing user actions:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to audit user actions',
    });
  }
}
