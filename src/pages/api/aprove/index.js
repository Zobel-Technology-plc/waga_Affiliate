import dbConnect from '../../../backend/config/dbConnect';
import User from '../../../backend/models/user';
import ConversionRecord from '../../../backend/models/conversionRecord';
import axios from 'axios';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'PATCH') {
    res.setHeader('Allow', ['PATCH']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  const { conversionId, status } = req.body;

  if (!conversionId || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid data provided.' });
  }

  try {
    const conversion = await ConversionRecord.findById(conversionId);

    if (!conversion) {
      return res.status(404).json({ success: false, message: 'Conversion record not found.' });
    }

    if (conversion.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Conversion request is not pending.' });
    }

    // Find the user
    const user = await User.findOne({ userId: conversion.userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Construct the message for Telegram
    const botToken = '7316973369:AAGYzlMkYWSgTobE6w7ETkDXrt0aR_a8YMg'; // Replace with your bot token
    const telegramApiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    let message;

    if (status === 'approved') {
      // Update only user's commission, do not touch points
      user.commission += conversion.birrEquivalent;
      await user.save();

      // Prepare approval message
      message = `✅ Dear user, your conversion request for ${conversion.pointsUsed} points to ${conversion.birrEquivalent} birr has been approved! Your updated commission balance is ${user.commission} birr.`;

      console.log(`Conversion approved for user ${user.userId}`);
    } else if (status === 'rejected') {
      // Prepare rejection message
      message = `❌ Dear user, your conversion request for ${conversion.pointsUsed} points to ${conversion.birrEquivalent} birr has been rejected. Please contact support for more details.`;

      console.log(`Conversion rejected for user ${user.userId}`);
    }

    // Update conversion record status
    conversion.status = status;
    await conversion.save();

    // Send message to the user
    await axios.post(telegramApiUrl, {
      chat_id: user.userId,
      text: message,
    });

    return res.status(200).json({
      success: true,
      message: `Conversion ${status} successfully and user notified.`,
      user,
      conversion,
    });
  } catch (error) {
    console.error('Error processing conversion:', error);
    return res.status(500).json({ success: false, message: 'Failed to process conversion request.' });
  }
}
