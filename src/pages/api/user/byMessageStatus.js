import dbConnect from '../../../backend/config/dbConnect';
import User from '../../../backend/models/user';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    const { status } = req.query;

    // Validate status query parameter
    if (status !== 'success' && status !== 'failed') {
      return res.status(400).json({
        success: false,
        message: 'Invalid status parameter. Use "success" or "failed".',
      });
    }

    try {
      // Find users based on lastMessageStatus
      const users = await User.find({ lastMessageStatus: status });

      return res.status(200).json({
        success: true,
        data: users,
        message: `Users with last message status: ${status}`,
      });
    } catch (error) {
      console.error('Error fetching users by message status:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch users by message status',
      });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
