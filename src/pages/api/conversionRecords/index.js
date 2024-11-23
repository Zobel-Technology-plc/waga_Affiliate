import dbConnect from '../../../backend/config/dbConnect';
import ConversionRecord from '../../../backend/models/conversionRecord';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    const { userId, status } = req.query;

    try {
      // Filter by userId and/or status if provided
      const query = {};
      if (userId) query.userId = userId;
      if (status) query.status = status;

      const conversionRecords = await ConversionRecord.find(query);

      if (!conversionRecords.length) {
        return res.status(404).json({ success: false, message: 'No conversion records found.' });
      }

      return res.status(200).json({
        success: true,
        data: conversionRecords,
      });
    } catch (error) {
      console.error('Error fetching conversion records:', error);
      return res.status(500).json({ success: false, message: 'No conversion records found.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }
}
