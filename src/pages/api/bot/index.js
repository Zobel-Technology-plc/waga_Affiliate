import dbConnect from '../../../backend/config/dbConnect';
import User from '../../../backend/models/user';
import axios from 'axios';

// Telegram bot token
const botToken = "7316973369:AAGYzlMkYWSgTobE6w7ETkDXrt0aR_a8YMg";  // Replace with your actual bot token

// Function to send a text message to the user
const sendMessage = async (chatId, text, replyMarkup = {}) => {
  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    await axios.post(apiUrl, {
      chat_id: chatId,
      text,
      reply_markup: replyMarkup, // Optional reply markup
    });
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

// Function to request the user's phone number
const requestPhoneNumber = async (chatId, userId) => {
  const inviteLink = `https://t.me/yourbot?start=${userId}`;

  const requestPhoneNumberMessage = {
    chat_id: chatId,
    text: `Please share your phone number to continue:\nHere is your unique invitation link: ${inviteLink}`,
    reply_markup: {
      one_time_keyboard: true,
      keyboard: [
        [
          {
            text: 'Share Phone Number',
            request_contact: true,
            one_time_keyboard: true,
          },
        ],
      ],
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

// Function to handle invite link logic
const handleInviteLink = async (userId, inviterUserId, chatId, joinerName) => {
  try {
    const user = await User.findOne({ userId });
    if (user && (user.hasJoinedViaInvite || user.phoneNumber)) {
      await sendMessage(chatId, 'You have already joined or are already a member.');
      return { success: false, message: 'You have already joined or are already a member' };
    }

    const inviter = await User.findOneAndUpdate(
      { userId: inviterUserId },
      { $inc: { points: 50000 } }, // Increment points for inviter
      { new: true }
    );

    if (inviter) {
      await sendMessage(inviterUserId, `Congratulations! You've earned 50000 points for inviting ${joinerName}.`);
    }

    await User.findOneAndUpdate(
      { userId },
      { hasJoinedViaInvite: true },
      { new: true }
    );

    await sendMessage(chatId, 'Welcome! You have joined via an invite link.');
    console.log('User joined via invite link and confirmation message sent:', chatId);

    return { success: true, message: 'User joined via invite link' };
  } catch (error) {
    console.error('Error handling join via invite link:', error);
    return { success: false, message: 'Failed to handle invite link' };
  }
};

// Main handler function
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

    // Extract the joining user's first name or username
    const joinerName = message.from.first_name || message.from.username || 'A user';

    await dbConnect();

    // Start command handler
    if (text && text.startsWith('/start')) {
      console.log('Start command received');
      const inviterUserId = text.split(' ')[1];

      if (inviterUserId) {
        const inviteResult = await handleInviteLink(userId, inviterUserId, chatId, joinerName);
        if (!inviteResult.success) {
          return res.status(200).json({ success: true, message: inviteResult.message });
        }
      }

      const phoneNumberRequested = await requestPhoneNumber(chatId, userId);
      if (phoneNumberRequested) {
        return res.status(200).json({ success: true, message: 'Phone number requested' });
      } else {
        return res.status(500).json({ success: false, message: 'Failed to send phone number request' });
      }

    // Handle contact (phone number) sharing
    } else if (message.contact) {
      const phoneNumber = message.contact.phone_number;

      try {
        // Save phone number in the database
        await User.findOneAndUpdate(
          { userId },
          { phoneNumber },
          { upsert: true, new: true }
        );

        // Remove the keyboard and ask for the city
        await sendMessage(chatId, 'Thanks for sharing your phone number! Now, please enter your city:', {
          remove_keyboard: true,
        });

        return res.status(200).json({ success: true, message: 'Phone number saved, asking for city and keyboard removed' });
      } catch (error) {
        console.error('Error saving phone number or removing keyboard:', error);
        return res.status(500).json({ success: false, message: 'Failed to save phone number or remove keyboard' });
      }

    // Handle city input from user
    } else if (text && !text.startsWith('/start') && !message.contact) {
      try {
        // Save the city in the database
        await User.findOneAndUpdate(
          { userId },
          { city: text }, // Save city entered by the user
          { upsert: true, new: true }
        );

        // Thank the user for registering
        await sendMessage(chatId, 'Thank you for registering!');

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
