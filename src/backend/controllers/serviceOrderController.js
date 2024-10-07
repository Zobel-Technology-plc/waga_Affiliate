import ServiceOrder from '../models/ServiceOrder';
import User from '../models/user';
import axios from 'axios';
import Service from '../models/service';
import { nanoid } from 'nanoid';

// Create a new service order and send a Telegram notification
export const createServiceOrder = async (req, res) => {
  try {
    const { userId, serviceId, serviceName, city, phoneNumber, orderFor } = req.body;

    // Log the incoming request data
    console.log("Received service order request:", req.body);

    // Validate required fields
    if (!userId || !orderFor || !serviceId || !serviceName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, orderFor, serviceId, and serviceName are required.',
      });
    }

    let userPhoneNumber = phoneNumber;
    let userCity = city; // Use the city from the body for "other" orders

    // Fetch user data if the order is for "self"
    if (orderFor === 'self') {
      const user = await User.findOne({ userId });

      if (!user || !user.phoneNumber || !user.city) {
        // If phone number or city is missing, send a Telegram message
        await sendIncompleteRegistrationNotificationToTelegram(userId);

        return res.status(400).json({
          success: false,
          message: 'Phone number and city are required for self orders but not found in the user profile. Please complete your registration.',
        });
      }

      // Use the user's saved phone number and city for self orders
      userPhoneNumber = user.phoneNumber;
      userCity = user.city;
    }

    // Validate city and phone number for 'other' orders
    if (orderFor === 'other' && (!city || !phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'City and Phone Number are required when ordering for others.',
      });
    }

    // Fetch the service details to get the starting price and commission
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found.',
      });
    }

    const { startingPrice, commission } = service;

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
    const orderId = nanoid(7);

    // Create the new service order with totalAmount and commission
    const newServiceOrder = new ServiceOrder({
      userId,
      serviceId: orderId,
      serviceName,  // Save serviceName in the order
      city: userCity,  // Use the user's city for "self" or the provided city for "other"
      phoneNumber: userPhoneNumber,
      orderFor,
      status: 'pending',
      points: 10000,
      commission,  // Use commission from the service
      totalAmount: startingPrice,  // Use the starting price as total amount
    });

    // Save the service order
    await newServiceOrder.save();

    // Send Telegram notification
    await sendServiceOrderNotificationToTelegram(userId, newServiceOrder);

    // Respond with the newly created service order
    res.status(201).json({ success: true, data: newServiceOrder });
  } catch (error) {
    console.error('Error creating service order:', error);
    res.status(500).json({ success: false, message: 'Failed to create service order due to server error.' });
  }
};

// Function to send an incomplete registration notification via Telegram
const sendIncompleteRegistrationNotificationToTelegram = async (userId) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || "7316973369:AAGYzlMkYWSgTobE6w7ETkDXrt0aR_a8YMg";
  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  // Message to notify the user they need to complete registration
  const message = `
    ⚠️ *Incomplete Registration*\n
    ውድ ደንበኛችን፤ ስልክ ቁጥር ወይም ከተማዎትን አላስገቡም እባክዎትን /start የሚለውን በመጫን ምዝገባዎትን ያጠናቁ
  `;

  try {
    await axios.post(apiUrl, {
      chat_id: userId,  // Assuming userId is their Telegram chat ID
      text: message,
      parse_mode: "Markdown",
    });
    console.log(`Incomplete registration message sent to user: ${userId}`);
  } catch (error) {
    console.error(`Error sending message to user ${userId}:`, error);
  }
};

// Send a notification message to Telegram with order details
const sendServiceOrderNotificationToTelegram = async (userId, order) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || "7316973369:AAGYzlMkYWSgTobE6w7ETkDXrt0aR_a8YMg";
  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  // Array of user IDs to send the message to (including the original user)
  const chatIds = [userId, 302775107, 5074449421];

  // Construct the message content
  let message = `
    🛒 *Service Order Confirmation*\n
    Service: ${order.serviceName}\n
    Service ID: ${order.serviceId}\n
    City: ${order.city}\n
    Order For: ${order.orderFor === 'self' ? 'Self' : 'Others'}
    ${order.orderFor === 'other' ? `*City*: ${order.city}\n` : ''}
    *Phone Number*: ${order.phoneNumber}\n
    *Order Status*: ${order.status}\n
    Commission: ${order.commission} %\n
    Points: 10000 (Pending)
  `;

  // Send the message to each chat ID
  for (const chatId of chatIds) {
    try {
      await axios.post(apiUrl, {
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      });
      console.log(`Message sent to user: ${chatId}`);
    } catch (error) {
      console.error(`Error sending message to user ${chatId}:`, error);
    }
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
export const getallServiceOrders = async (req, res) => {
  try {
    // Fetch service orders for the user
    const serviceOrders = await ServiceOrder.find({ }).sort({ createdAt: -1 });

    // Respond with the fetched orders
    res.status(200).json({ success: true, data: serviceOrders });
  } catch (error) {
    console.error('Error fetching service orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch service orders.' });
  }
};