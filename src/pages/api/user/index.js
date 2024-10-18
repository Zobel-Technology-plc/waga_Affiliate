// pages/api/users/index.js
import dbConnect from '../../../backend/config/dbConnect';
import User from '../../../backend/models/user';

export default async function handler(req, res) {
  await dbConnect();

  try {
    const { last30days } = req.query;

    let users;
    if (last30days === 'true') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      users = await User.find({ createdAt: { $gte: thirtyDaysAgo } });
    } else {
      users = await User.find({});
    }

    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
