// pages/api/checkMembership.js

import dbConnect from '../../../backend/config/dbConnect';
import User from '../../../backend/models/user';
import UserAction from '../../../backend/models/useraction';

export default async function handler(req, res) {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  const TELEGRAM_BOT_TOKEN = '7316973369:AAGYzlMkYWSgTobE6w7ETkDXrt0aR_a8YMg';
  const TELEGRAM_CHANNEL_ID = '@Waga_affiliate_bot';

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMember?chat_id=${TELEGRAM_CHANNEL_ID}&user_id=${userId}`
    );
    const data = await response.json();

    console.log('Telegram API Response:', data);

    if (!data.ok) {
      return res.status(500).json({ message: 'Failed to check membership', error: data.description });
    }

    const isMember =
      data.result.status === 'member' ||
      data.result.status === 'administrator' ||
      data.result.status === 'creator';

    if (isMember) {
      await dbConnect();

      // Save the action to the database with 0 points
      const newAction = new UserAction({
        userId,
        action: 'Join our TG channel',
        points: 0,
        timestamp: new Date(),
      });

      await newAction.save();

      // Update the user's total points
      const user = await User.findOne({ userId });
      if (user) {
        user.points = (user.points || 0);
        await user.save();
      } else {
        // If user doesn't exist, create a new one with 0 points
        await User.create({ userId, points: 0 });
      }

      res.json({
        isMember,
        completedAction: 'Join our TG channel',
      });
    } else {
      res.json({
        isMember,
        completedAction: null,
      });
    }
  } catch (error) {
    console.error('Error checking Telegram membership:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}
