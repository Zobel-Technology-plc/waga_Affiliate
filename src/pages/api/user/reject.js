
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
        if (!user || user.status !== 'pending') {
          return res.status(404).json({ success: false, message: 'Pending request not found' });
        }
  
        user.status = 'rejected';
        await user.save();
  
        res.status(200).json({ success: true, message: 'User rejected' });
      } catch (error) {
        console.error('Error rejecting user:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
      }
    } else {
      res.setHeader('Allow', ['POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  }
  