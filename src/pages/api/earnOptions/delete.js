import dbConnect from '../../../backend/config/dbConnect';
import EarnOption from '../../../backend/models/earnoptions';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ success: false, message: 'Option ID is required' });
    }

    const earnOption = await EarnOption.findByIdAndDelete(id);

    if (!earnOption) {
      return res.status(404).json({ success: false, message: 'Earn option not found' });
    }

    return res.status(200).json({ success: true, message: 'Earn option deleted successfully' });
  } catch (error) {
    console.error('Error deleting earn option:', error);
    return res.status(500).json({ success: false, message: 'Error deleting earn option' });
  }
}
