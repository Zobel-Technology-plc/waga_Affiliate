import dbConnect from '../../../backend/config/dbConnect';
import User from '../../../backend/models/user';
import UserAction from '../../../backend/models/useraction';
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
      reply_markup: replyMarkup,
    });
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

// Function to request the user's phone number
const requestPhoneNumber = async (chatId, userId) => {
  const inviteLink = `https://t.me/Waga_affiliate_bot?start=${userId}`;

  const requestPhoneNumberMessage = {
    chat_id: chatId,
    text: `እንኳን ደህና መጡ እባክዎ ከታች የተቀመጠውን Share Phone Number በመንካት ይቀጥሉ:\n`,
    reply_markup: {
      keyboard: [
        [
          {
            text: ' 📞 Share Phone Number',
            request_contact: true,
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
    await dbConnect();

    // Fetch the invited user
    const user = await User.findOne({ userId });

    // Check if the user has already joined via invite or is already a member of the bot
    if (user && (user.hasJoinedViaInvite || user.phoneNumber)) {
      await sendMessage(chatId, 'You are already a member or have already joined via an invite.');
      console.log(`User ${userId} is already a member or joined via invite.`);
      return { success: false, message: 'User is already a member or has already joined via invite' };
    }

    // Check if inviter has already invited the joining user
    const existingInvite = await UserAction.findOne({ userId: inviterUserId, joinerUserId: userId });
    if (existingInvite) {
      console.log(`User ${inviterUserId} has already invited ${userId}. No points awarded.`);
      await sendMessage(inviterUserId, `You've already invited ${joinerName}. No additional points awarded.`);
      return { success: false, message: 'Inviter has already invited this user' };
    }

    // Mark the invited user as having joined via the invite
    await User.findOneAndUpdate(
      { userId },
      { hasJoinedViaInvite: true },
      { new: true }
    );

    // Update inviter's points and notify the inviter
    const inviter = await User.findOneAndUpdate(
      { userId: inviterUserId },
      { $inc: { points: 50000 } },
      { new: true }
    );

    if (inviter) {
      // Notify inviter about the points earned
      await sendMessage(inviterUserId, `Congratulations! You've earned 50000 points for inviting ${joinerName}.`);

      // Save the invite action in the UserAction model
      const newAction = new UserAction({
        userId: inviterUserId,
        action: `Invited ${joinerName}`,
        points: 50000,
        joinerUserId: userId,   // Save the joinerUserId (instead of joinerName)
        timestamp: new Date(),
      });
      await newAction.save();
    }

    // Send a welcome message to the new user
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
      const inviterUserId = text.split(' ')[1]; // Extract inviter userId from the invite link

      if (inviterUserId) {
        // Handle the invite link logic
        const inviteResult = await handleInviteLink(userId, inviterUserId, chatId, joinerName);
        if (!inviteResult.success) {
          return res.status(200).json({ success: true, message: inviteResult.message });
        }
      }

      // Request the user's phone number after handling invite
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
        // Save the phone number in the database
        await User.findOneAndUpdate(
          { userId },
          { phoneNumber },
          { upsert: true, new: true }
        );

        // Remove the keyboard and ask for the city
        await sendMessage(chatId, 'የስልክ ቁጥርዎን ስለሰጡን እናመሰግናለን! በመቀጠል ፣ ያሉበትን ከተማ ያስገቡ:', {
          remove_keyboard: true,
        });

        return res.status(200).json({ success: true, message: 'Phone number saved, asking for city and keyboard removed' });
      } catch (error) {
        console.error('Error saving phone number or removing keyboard:', error);
        return res.status(500).json({ success: false, message: 'Failed to save phone number or remove keyboard' });
      }

    // Handle city input from the user
    } else if (text && !text.startsWith('/start') && !message.contact) {
      try {
        // Save the city in the database
        await User.findOneAndUpdate(
          { userId },
          { city: text },
          { upsert: true, new: true }
        );
    
        // Generate the invite link based on the updated user's ID
        const inviteLink = `https://t.me/Waga_affiliate_bot?start=${userId}`;
    
        // Thank the user for registering and send their unique invite link
        await sendMessage(chatId, `ስለተመዘገቡ እናመሰናለን!\n ይህ የእርስዎ የተለየ የመጋበዣ ሊንክ ነው: ${inviteLink} \n Waga የሚለውን በመጫን ይቀጥሉ`);
    
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
