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

    let userPhoneNumber = phoneNumber;
    if (orderFor === 'self') {
      const user = await User.findOne({ userId });
      if (!user || !user.phoneNumber) {
        return res.status(400).json({ success: false, message: 'Phone number is required for self orders but not found.' });
      }
      userPhoneNumber = user.phoneNumber;
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

    // Generate a unique serviceId
    const serviceId = nanoid(7);

    // Create a new service order (but don't award points yet)
    const newServiceOrder = new ServiceOrder({
      userId,
      serviceId,
      city: orderFor === 'other' ? city : '',
      phoneNumber: userPhoneNumber,
      orderFor,
      status: 'pending',  // Default status is pending
      points: 10000,  // Points to be awarded upon completion
    });

    // Save the service order to the database
    await newServiceOrder.save();

    // Send a notification to Telegram (optional)
    await sendServiceOrderNotificationToTelegram(userId, newServiceOrder);

    // Respond with the newly created service order (no points awarded yet)
    res.status(201).json({ success: true, data: newServiceOrder });
  } catch (error) {
    console.error('Error creating service order:', error);
    res.status(500).json({ success: false, message: 'Failed to create service order. Server error.' });
  }
};



// Send a notification message to Telegram with order details
const sendServiceOrderNotificationToTelegram = async (userId, order) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = userId;
  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  let message = `
    🛒 *Service Order Confirmation*\n
    Service ID: ${order.serviceId}\n
    Order For: ${order.orderFor === 'self' ? 'Self' : 'Others'}\n
    ${order.orderFor === 'other' ? `*City*: ${order.city}\n` : ''}
    *Phone Number*: ${order.phoneNumber}\n
    *Order Status*: ${order.status}\n
    Points: 10000 (Pending)
  `;

  try {
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
