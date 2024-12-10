import dbConnect from '../../../backend/config/dbConnect';
import User from '../../../backend/models/user';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'POST') {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    try {
      const user = await User.findOne({ userId });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      if (user.role === 'seller') {
        return res.status(400).json({ success: false, message: 'User is already a seller' });
      }

      if (user.status === 'pending') {
        return res.status(400).json({ success: false, message: 'Request already pending' });
      }

      user.status = 'pending';
      await user.save();

      res.status(200).json({ success: true, message: 'Request submitted successfully' });
    } catch (error) {
      console.error('Error submitting seller request:', error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
