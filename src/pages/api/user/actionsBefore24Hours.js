// pages/api/user/actionsBefore24Hours.js

import dbConnect from '../../../backend/config/dbConnect';
import UserAction from '../../../backend/models/useraction';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'Missing userId in query' });
    }

    try {
      const currentTime = new Date();
      const twentyFourHoursAgo = new Date(currentTime.getTime() - 24 * 60 * 60 * 1000);

      // Find actions performed before 24 hours ago and exclude those starting with "Invited"
      const actionsBefore24Hours = await UserAction.find({
        userId,
        timestamp: { $lt: twentyFourHoursAgo },
        action: { $not: { $regex: '^Invited' || '^Share', $options: 'i' || 's'} }, // Exclude actions starting with "Invited" (case-insensitive)
      }).select('action points timestamp -_id');

      res.status(200).json({
        success: true,
        data: actionsBefore24Hours,
      });
    } catch (error) {
      console.error('Error fetching user actions before 24 hours:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user actions before 24 hours',
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
