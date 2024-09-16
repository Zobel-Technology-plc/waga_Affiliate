import dbConnect from '../../../backend/config/dbConnect';
import User from '../../../backend/models/user';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import FormData from 'form-data';
import sharp from 'sharp';

const botToken = "7350305630:AAEsjUdDvgDlsXhToZel8NoI3SCxpv5lIrE";  // Replace with your actual bot token

// Function to resize and send an image to the user
const sendImageToUser = async (chatId) => {
  const apiUrl = `https://api.telegram.org/bot${botToken}/sendPhoto`;
  const imagePath = path.resolve('./public/images/Zobel Technology Blue.png'); 

  const resizedImagePath = path.resolve('./public/images/Zobel_Tech_Resized.png');
  try {
    await sharp(imagePath)
      .resize(800, 600) // Resize the image to 800x600
      .toFile(resizedImagePath);
  } catch (error) {
    console.error('Error processing image:', error);
    return;
  }

  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('photo', fs.createReadStream(resizedImagePath));
  formData.append('caption', 'Please post this image to your story and send us a confirmation message.');

  try {
    await axios.post(apiUrl, formData, {
      headers: formData.getHeaders(),
    });
  } catch (error) {
    console.error('Error sending image:', error);
  }
};

// Function to send a text message to the user
const sendMessage = async (chatId, text) => {
  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    await axios.post(apiUrl, {
      chat_id: chatId,
      text,
    });
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

// Function to request the user's phone number
const requestPhoneNumber = async (chatId, userId) => {
  const inviteLink = `https://t.me/waganextbot?start=${userId}`;

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
      { $inc: { points: 1000 } },
      { new: true }
    );

    if (inviter) {
      // Modify message to include the joiner's name
      await sendMessage(inviterUserId, `Congratulations! You've earned 1000 points for inviting ${joinerName}.`);
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

    if (text && text.startsWith('/start')) {
      console.log('Start command received');
      const inviterUserId = text.split(' ')[1];

      if (inviterUserId) {
        // Handle invite link logic and pass the joiner's name
        const inviteResult = await handleInviteLink(userId, inviterUserId, chatId, joinerName);
        if (!inviteResult.success) {
          return res.status(200).json({ success: true, message: inviteResult.message });
        }
      }

      // Request phone number after handling invite
      const phoneNumberRequested = await requestPhoneNumber(chatId, userId);
      if (phoneNumberRequested) {
        return res.status(200).json({ success: true, message: 'Phone number requested' });
      } else {
        return res.status(500).json({ success: false, message: 'Failed to send phone number request' });
      }
    } else if (message.contact) {
      const phoneNumber = message.contact.phone_number;

      try {
        await User.findOneAndUpdate(
          { userId },
          { phoneNumber },
          { upsert: true, new: true }
        );

        // Send the image after the contact is shared
        await sendImageToUser(chatId);
        return res.status(200).json({ success: true, message: 'Phone number saved and image sent' });
      } catch (error) {
        console.error('Error saving phone number or sending image:', error);
        return res.status(500).json({ success: false, message: 'Failed to save phone number or send image' });
      }
    } else if (text === 'I posted the image') {
      try {
        await User.findOneAndUpdate(
          { userId },
          { $inc: { points: 500 }, hasPostedStory: true },
          { new: true }
        );

        // Send a thank you message after awarding points
        await sendMessage(chatId, 'Thank you for posting the image! You have earned 500 points.');
        return res.status(200).json({ success: true, message: 'Points awarded and thank you message sent' });
      } catch (error) {
        console.error('Error updating user status:', error);
        return res.status(500).json({ success: false, message: 'Failed to update user status or send thank you message' });
      }
    } else {
      return res.status(200).json({ success: true, message: 'Command received' });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }
}
