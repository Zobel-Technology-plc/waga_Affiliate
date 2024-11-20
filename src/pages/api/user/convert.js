import dbConnect from '../../../backend/config/dbConnect';
import User from '../../../backend/models/user';
import ConversionRecord from '../../../backend/models/conversionRecord';
import axios from 'axios';

export default async function handler(req, res) {
  await dbConnect(); // Ensure the database is connected for both POST and GET requests

  if (req.method === 'POST') {
    const { userId, birrEquivalent, pointsUsed } = req.body;

    if (!userId || birrEquivalent == null || pointsUsed == null) {
      return res.status(400).json({ success: false, message: 'Invalid data provided' });
    }

    try {
      const user = await User.findOne({ userId });

      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Update user details
      user.commission += birrEquivalent;
      user.points = 0; // Reset points to 0 after conversion
      await user.save();

      console.log(`Updated user: ${user.userId}, Commission: ${user.commission}, Points: ${user.points}`);

      // Save conversion record
      const conversionRecord = new ConversionRecord({
        userId,
        pointsUsed,
        birrEquivalent,
      });

      await conversionRecord.save();
      console.log(`Saved conversion record for user: ${userId}`);

      // Send success message via Telegram bot
      const botToken = '7316973369:AAGYzlMkYWSgTobE6w7ETkDXrt0aR_a8YMg'; 
      const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

      await axios.post(telegramApiUrl, {
        chat_id: userId,
        text: `You have successfully converted ${pointsUsed} points to ${birrEquivalent} birr! Your points are now 0.`,
      });

      return res.status(200).json({
        success: true,
        message: `Converted ${pointsUsed} points to ${birrEquivalent} birr successfully.`,
      });
    } catch (error) {
      console.error('Error during conversion:', error);
      return res.status(500).json({ success: false, message: 'Conversion failed' });
    }
  } else if (req.method === 'GET') {
    const { userId } = req.query;  // Expecting userId as a query parameter

    try {
      let conversionRecords;
      if (userId) {
        conversionRecords = await ConversionRecord.find({ userId });
      } else {
        conversionRecords = await ConversionRecord.find({});
      }

      if (!conversionRecords || conversionRecords.length === 0) {
        return res.status(404).json({ success: false, message: 'No conversion records found' });
      }

      const totalConversions = conversionRecords.reduce((sum, record) => sum + record.birrEquivalent, 0);

      return res.status(200).json({
        success: true,
        data: conversionRecords,
      });
    } catch (error) {
      console.error('Error fetching conversion records:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch conversion records' });
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
