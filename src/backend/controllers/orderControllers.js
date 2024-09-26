import Order from '../models/order';
import User from '../models/user';
import axios from 'axios';
import { updateCommission } from './commissionController';

export const newOrder = async (req, res) => {
  const { userId, orderItems, totalAmount, commissionamount, address, phoneNumber, orderFor } = req.body;

  console.log('Request body:', req.body);

  try {
    let userPhoneNumber = phoneNumber;

    // If order is for 'self', retrieve the phone number from the user's profile if not provided
    if (orderFor === 'self') {
      const user = await User.findOne({ userId });
      if (!user || !user.phoneNumber) {
        return res.status(400).json({ success: false, message: 'Phone number is required for self orders but not found.' });
      }
      userPhoneNumber = user.phoneNumber;  // Use phone number from user's profile
    }

    // Create a new order with commission set to "pending"
    const order = await Order.create({
      userId,
      orderItems,
      totalAmount,
      commissionamount,
      commissionStatus: 'pending',  // Set the commission status to "pending"
      address: orderFor === 'other' ? address : '',  // Address only needed if ordering for "other"
      phoneNumber: userPhoneNumber,  // Use retrieved or provided phone number
      paymentStatus: 'Pending',  // Set payment status to "Pending"
    });

    console.log('Created order:', order);

    // Send order details to Telegram
    await sendOrderNotificationToTelegram(userId, order);

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(400).json({ success: false, message: 'Order creation failed' });
  }
};

// Send a notification message to Telegram with order details
const sendOrderNotificationToTelegram = async (userId, order) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || "7316973369:AAGYzlMkYWSgTobE6w7ETkDXrt0aR_a8YMg";
  const chatId = userId;  // Use the user's Telegram chat ID (userId from Telegram)
  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  // Construct the message content
  let message = `
    🛒 *Order Confirmation*\n
    Order ID: ${order.orderId}\n`;

  // Only include total amount if it's greater than 0
  if (order.totalAmount > 0) {
    message += `Total Amount: ${order.totalAmount} birr\n`;
  }

  message += `Payment Status: ${order.paymentStatus}\n`;
  message += `Commission: ${order.commissionamount} birr (Pending)\n\n`;

  // Add order items to the message, excluding price if it's 0
  message += `*Order Items:*\n${order.orderItems.map(item => {
    // Only include price if it's greater than 0, otherwise just include name and quantity
    if (order.totalAmount / item.quantity > 0) {
      return `- ${item.name} (${item.quantity}x): ${(order.totalAmount / item.quantity).toFixed(2)} birr`;
    } else {
      return `- ${item.name} (${item.quantity}x)`;
    }
  }).join('\n')}`;

  // Include address and phone number if provided
  if (order.address && order.phoneNumber) {
    message += `\n*Shipping Details:*\nAddress: ${order.address}\nPhone Number: ${order.phoneNumber}\n`;
  }

  console.log('Message to send:', message);

  try {
    await axios.post(apiUrl, {
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
    });
  } catch (error) {
    console.error("Error sending order notification to Telegram:", error);
  }
};



export const getOrders = async (req, res) => {
  const { userId } = req.query;

  try {
    // Fetch orders based on the userId
    const orders = await Order.find({ userId }).sort({ createdAt: -1 }); // Sort by creation date, newest first
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
};

export const updatePaymentStatus = async (req, res) => {
  const { orderId, paymentStatus } = req.body;

  try {
    // Find the order by its ID
    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Update the payment status
    order.paymentStatus = paymentStatus;

    // Check if payment is completed and commission is still pending
    if (paymentStatus === 'Completed' && order.commissionStatus === 'pending') {
      // Reward the user commission and update commission status
      await updateCommission(order.userId, order.commissionamount);
      order.commissionStatus = 'completed';

      // Optionally reward points
      await rewardUserPoints(order.userId, 2000);

      // Prevent multiple rewards by marking points as rewarded
      order.pointsRewarded = true;
    }

    await order.save();

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ success: false, message: 'Failed to update payment status' });
  }
};

// Function to reward points to the user
const rewardUserPoints = async (userId, points) => {
  try {
    await axios.post('/api/points', {
      userId,
      points,
    });
    console.log(`Successfully rewarded ${points} points to user ${userId}`);
  } catch (error) {
    console.error(`Error rewarding points to user ${userId}:`, error);
  }
};
