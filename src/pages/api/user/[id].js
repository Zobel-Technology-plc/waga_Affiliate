// pages/api/user/[id].js

import dbConnect from '../../../backend/config/dbConnect';
import User from '../../../backend/models/user';

export default async function handler(req, res) {
  const { id } = req.query; // Get the user ID from the query params

  await dbConnect();

  try {
    const user = await User.findOne({ userId: id });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        City:user.city,
        phoneNumber: user.phoneNumber,
        points: user.points,
        commission: user.commission,
        role: user.role,
        status: user.status
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
