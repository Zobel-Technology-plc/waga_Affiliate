import ServiceOrder from '../models/ServiceOrder';
import User from '../models/user';
import axios from 'axios';
import { nanoid } from 'nanoid';

// Create a new service order and send a Telegram notification
export const createServiceOrder = async (req, res) => {
  try {
    const { userId, city, phoneNumber, orderFor } = req.body;

    // Validate required fields
    if (!userId || !orderFor) {
      return res.status(400).json({ success: false, message: 'User ID and orderFor are required.' });
    }

    // If the user selected 'self', retrieve their saved phone number
    let userPhoneNumber = phoneNumber;
    if (orderFor === 'self') {
      const user = await User.findOne({ userId });

      if (!user || !user.phoneNumber) {
        return res.status(400).json({ success: false, message: 'Phone number is required for self orders but not found.' });
      }

      userPhoneNumber = user.phoneNumber; // Use the phone number from the user's profile
    }

    // If order is for others, city and phoneNumber are required
    if (orderFor === 'other' && (!city || !phoneNumber)) {
      return res.status(400).json({ success: false, message: 'City and Phone Number are required when ordering for others.' });
    }

    const lastOrder = await ServiceOrder.findOne({ userId }).sort({ createdAt: -1 });

    if (lastOrder) {
      const timeSinceLastOrder = (Date.now() - new Date(lastOrder.createdAt).getTime()) / 1000;
      if (timeSinceLastOrder < 20) {
        return res.status(429).json({
          success: false,
          message: `Please wait ${Math.ceil(20 - timeSinceLastOrder)} seconds before creating a new order.`,
        });
      }
    }

    // Generate a unique 7-character serviceId
    const serviceId = nanoid(7);

    // Create a new service order
    const newServiceOrder = new ServiceOrder({
      userId,
      serviceId,
      city: orderFor === 'other' ? city : '', // Save city only if orderFor is 'other'
      phoneNumber: userPhoneNumber, // Use retrieved phone number for 'self' or provided one for 'other'
      orderFor, // Save orderFor (self/other)
      status: 'pending', // Set default status
    });

    // Save the service order to the database
    await newServiceOrder.save();

    // Send a notification to Telegram
    await sendServiceOrderNotificationToTelegram(userId, newServiceOrder);

    // Respond with the newly created service order
    res.status(201).json({ success: true, data: newServiceOrder });
  } catch (error) {
    console.error('Error creating service order:', error);
    res.status(500).json({ success: false, message: 'Failed to create service order. Server error.' });
  }
};

// Send a notification message to Telegram with order details
const sendServiceOrderNotificationToTelegram = async (userId, order) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || "7350305630:AAEsjUdDvgDlsXhToZel8NoI3SCxpv5lIrE";
  const chatId = userId;
  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  // Construct the message content
  let message = `
    🛒 *Service Order Confirmation*\n
    Service ID: ${order.serviceId}\n
    Order For: ${order.orderFor === 'self' ? 'Self' : 'Others'}\n
    ${order.orderFor === 'other' ? `*City*: ${order.city}\n` : ''}
    *Phone Number*: ${order.phoneNumber}\n
    *Order Status*: ${order.status}
  `;

  // Log the message for debugging purposes
  console.log('Message to send:', message);

  try {
    // Send the message to Telegram
    await axios.post(apiUrl, {
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
    });
  } catch (error) {
    console.error("Error sending service order notification to Telegram:", error);
  }
};


export const getServiceOrders = async (req, res) => {
  try {
    const { userId } = req.query;

    // Validate that the userId is provided
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required.' });
    }

    // Fetch service orders for the user
    const serviceOrders = await ServiceOrder.find({ userId }).sort({ createdAt: -1 });

    // Respond with the fetched orders
    res.status(200).json({ success: true, data: serviceOrders });
  } catch (error) {
    console.error('Error fetching service orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch service orders.' });
  }
};
