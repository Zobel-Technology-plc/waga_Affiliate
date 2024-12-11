// pages/api/users/index.js
import dbConnect from '../../../backend/config/dbConnect';
import User from '../../../backend/models/user';

export default async function handler(req, res) {
  const { last30days, hasCommission, status, id } = req.query; // Include id for single user fetch
  await dbConnect();

  try {
    // Handle single user fetch if `id` is provided
    if (id) {
      const user = await User.findOne({ userId: id });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      return res.status(200).json({
        success: true,
        data: {
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          city: user.city,
          phoneNumber: user.phoneNumber,
          points: user.points,
          commission: user.commission,
          role: user.role,
          status: user.status || 'N/A',
        },
      });
    }

    // Otherwise, fetch multiple users with filters
    const commissionCondition = hasCommission === 'true' ? { commission: { $gt: 0 } } : {};
    const statusCondition = status ? { status } : {};

    const selectFields = 'userId firstName lastName username city phoneNumber points commission role status createdAt';
    let users;

    if (last30days === 'true') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      users = await User.find({
        createdAt: { $gte: thirtyDaysAgo },
        ...commissionCondition,
        ...statusCondition,
      }).select(selectFields);
    } else {
      users = await User.find({
        ...commissionCondition,
        ...statusCondition,
      }).select(selectFields);
    }

    // Format response data
    const formattedUsers = users.map(user => ({
      userId: user.userId,
      firstName: user.firstName ,
      lastName: user.lastName ,
      username: user.username,
      city: user.city ,
      phoneNumber: user.phoneNumber,
      points: user.points ,
      commission: user.commission ,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt ? user.createdAt.toISOString() : null,
    }));

    res.status(200).json({
      success: true,
      data: formattedUsers,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
