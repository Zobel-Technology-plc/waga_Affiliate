import dbConnect from '../../../backend/config/dbConnect';
import User from '../../../backend/models/user';
import ConversionRecord from '../../../backend/models/conversionRecord';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    const { userId, birrEquivalent, pointsUsed } = req.body;

    if (!userId || birrEquivalent == null || pointsUsed == null) {
      return res.status(400).json({ success: false, message: 'Invalid data provided' });
    }

    try {
      const user = await User.findOne({ userId });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (user.points < pointsUsed) {
        return res.status(400).json({ success: false, message: 'Insufficient points.' });
      }

      // Deduct points from the user
      user.points -= pointsUsed;
      await user.save();

      // Create a new conversion record
      console.log('Saving conversion record:', { userId, pointsUsed, birrEquivalent, status: 'pending' });
      const conversionRecord = new ConversionRecord({
        userId,
        pointsUsed,
        birrEquivalent,
        status: 'pending', // Explicitly set the status to pending
      });

      const savedRecord = await conversionRecord.save();

      // Log the saved record to confirm it was saved correctly
      console.log('Saved conversion record:', savedRecord);

      // Check if status field is present in the saved record
      if (!savedRecord.status) {
        console.error('Status field is missing in the saved record:', savedRecord);
      }

      return res.status(200).json({
        success: true,
        message: `Conversion request for ${pointsUsed} points to ${birrEquivalent} birr has been submitted for approval.`,
      });
    } catch (error) {
      console.error('Error during conversion:', error);
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
      console.error('Error fetching conversion records:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch conversion records' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }
}
