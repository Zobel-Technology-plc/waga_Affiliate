// pages/api/users/index.js
import dbConnect from '../../../backend/config/dbConnect';
import User from '../../../backend/models/user';

export default async function handler(req, res) {
  await dbConnect();

  try {
    const { last30days, hasCommission } = req.query;

    let users;
    const commissionCondition = hasCommission === 'true' ? { commission: { $gt: 0 } } : {}; // Apply commission filter if hasCommission=true

    if (last30days === 'true') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      users = await User.find({
        createdAt: { $gte: thirtyDaysAgo },
        ...commissionCondition, // Combine with commission filter if applicable
      });
    } else {
      users = await User.find({
        ...commissionCondition, // Only apply commission filter if applicable
      });
    }

    // Calculate total commission if the hasCommission flag is true
    let totalCommission = 0;
    if (hasCommission === 'true') {
      totalCommission = users.reduce((acc, user) => acc + (user.commission || 0), 0); // Sum up the commissions
    }

    res.status(200).json({
      success: true,
      data: users,
      totalCommission: hasCommission === 'true' ? totalCommission : null, // Only return total if hasCommission is true
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
}
