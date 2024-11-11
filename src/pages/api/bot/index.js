import dbConnect from '../../../backend/config/dbConnect';
import User from '../../../backend/models/user';
import UserAction from '../../../backend/models/useraction';
import axios from 'axios';

const botToken = "7316973369:AAGYzlMkYWSgTobE6w7ETkDXrt0aR_a8YMg";

const sendMessage = async (chatId, text, replyMarkup = {}) => {
  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    await axios.post(apiUrl, {
      chat_id: chatId,
      text,
      reply_markup: replyMarkup,
    });
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

const requestPhoneNumber = async (chatId, userId) => {
  const requestPhoneNumberMessage = {
    chat_id: chatId,
    text: `እንኳን ደህና መጡ እባክዎ ከታች የተቀመጠውን   "SHARE PHONE NUMBER"  በመንካት ይቀጥሉ::\n`,
    reply_markup: {
      keyboard: [
        [
          {
            text: ' 📞 Share Phone Number',
            request_contact: true,
          },
        ],
      ],
      resize_keyboard: true,
    },
  };

  try {
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, requestPhoneNumberMessage);
    console.log('Phone number request sent to user:', chatId);
    return true;
  } catch (error) {
    console.error('Error sending phone number request:', error);
    return false;
  }
};

const handleInviteLink = async (userId, inviterUserId, chatId, joinerName) => {
  try {
    await dbConnect();
    const user = await User.findOne({ userId });

    if (user && (user.hasJoinedViaInvite || user.phoneNumber || user.hasStartedBot)) {
      await sendMessage(chatId, 'You are already a member, have already joined via an invite, or have already started the bot.');
      return { success: false, message: 'User is already a member, has joined via invite, or started the bot' };
    }

    const existingInvite = await UserAction.findOne({ userId: inviterUserId, joinerUserId: userId });
    if (existingInvite) {
      await sendMessage(inviterUserId, `You've already invited ${joinerName}. No additional points awarded.`);
      return { success: false, message: 'Inviter has already invited this user' };
    }

    await User.findOneAndUpdate(
      { userId },
      { hasJoinedViaInvite: true },
      { new: true }
    );

    const inviter = await User.findOneAndUpdate(
      { userId: inviterUserId },
      { $inc: { points: 50000 } },
      { new: true }
    );

    if (inviter) {
      await sendMessage(inviterUserId, `Congratulations! You've earned 50000 points for inviting ${joinerName}.`);

      const newAction = new UserAction({
        userId: inviterUserId,
        action: `Invited ${joinerName}`,
        points: 50000,
        joinerUserId: userId,
        timestamp: new Date(),
      });
      await newAction.save();
    }

    await sendMessage(chatId, 'Welcome! You have joined via an invite link.');
    return { success: true, message: 'User joined via invite link' };
  } catch (error) {
    console.error('Error handling join via invite link:', error);
    return { success: false, message: 'Failed to handle invite link' };
  }
};

export default async function handler(req, res) {
  console.log('Request received:', req.body);

  if (req.method === 'POST') {
    const { message } = req.body;

    if (!message || !message.chat || !message.from || (!message.text && !message.contact)) {
      return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    const chatId = message.chat.id;
    const userId = message.from.id;
    const text = message.text;

    const joinerName = message.from.first_name || message.from.username || 'A user';

    await dbConnect();

    // Handle /start command
    if (text && text.startsWith('/start')) {
      console.log('Start command received');
      const inviterUserId = text.split(' ')[1]; // Check if an inviterUserId is passed with the /start command

      await User.findOneAndUpdate(
        { userId },
        { hasStartedBot: true },
        { upsert: true, new: true }
      );

      let inviteHandled = false;

      // If inviterUserId exists, handle the invite link logic
      if (inviterUserId) {
        const inviteResult = await handleInviteLink(userId, inviterUserId, chatId, joinerName);
        if (!inviteResult.success) {
          return res.status(200).json({ success: true, message: inviteResult.message });
        }
        inviteHandled = true;
      }

      // Request phone number for all users (with or without invite link)
      const phoneNumberRequested = await requestPhoneNumber(chatId, userId);

      if (phoneNumberRequested) {
        return res.status(200).json({
          success: true,
          message: inviteHandled ? 'Invite handled, phone number requested' : 'Phone number requested',
        });
      } else {
        return res.status(500).json({ success: false, message: 'Failed to send phone number request' });
      }

    // Handle contact (phone number) sharing
    } else if (message.contact) {
      const phoneNumber = message.contact.phone_number;

      try {
        await User.findOneAndUpdate(
          { userId },
          { phoneNumber },
          { upsert: true, new: true }
        );

        await sendMessage(chatId, 'እባክዎ የሚኖሩበትን ከተማ ያስገቡ:', {
          remove_keyboard: true,
        });

        return res.status(200).json({ success: true, message: 'Phone number saved, asking for city' });
      } catch (error) {
        console.error('Error saving phone number or removing keyboard:', error);
        return res.status(500).json({ success: false, message: 'Failed to save phone number or remove keyboard' });
      }

    // Handle city input from the user
    } else if (text && !text.startsWith('/start') && !message.contact) {
      try {
        await User.findOneAndUpdate(
          { userId },
          { city: text },
          { upsert: true, new: true }
        );

        const inviteLink = `https://t.me/Waga_affiliate_bot?start=${userId}`;

        await sendMessage(chatId, `ስለተመዘገቡ እናመሰግናለን! ይህ የእርሶ ልዩ መጋበዣ ማስፈንጥሪያ ነው: ${inviteLink}`);

        return res.status(200).json({ success: true, message: 'City saved, registration complete' });
      } catch (error) {
        console.error('Error saving city or sending thank you message:', error);
        return res.status(500).json({ success: false, message: 'Failed to save city or send thank you message' });
      }
    }
  } else {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }
}
