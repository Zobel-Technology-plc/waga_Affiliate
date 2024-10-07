import Order from '../models/order';
import User from '../models/user';
import axios from 'axios';
import dbConnect from '../../backend/config/dbConnect';

export const newOrder = async (req, res) => {
  const { userId, orderItems, totalAmount, commissionamount, address, phoneNumber, orderFor } = req.body;

  console.log('Request body:', req.body);

  try {
    // Initialize variables to hold the final phone number and address values
    let userPhoneNumber = phoneNumber;
    let userAddress = address;

    // If the order is for 'self', retrieve the phone number and city from the user's profile
    if (orderFor === 'self') {
      const user = await User.findOne({ userId });

      if (!user) {
        return res.status(400).json({ success: false, message: 'User not found.' });
      }

      // Use the phone number from the user's profile if not provided in the request body
      userPhoneNumber = user.phoneNumber || phoneNumber;

      // Use the user's saved city as the address
      userAddress = user.city;  // Default to empty string if no city is available

      // Check if phone number or city is missing
      if (!userPhoneNumber) {
        // Send a Telegram message to the user prompting them to complete their profile
        await sendProfileCompletionMessageToTelegram(userId, 'phone number');
        return res.status(400).json({ success: false, message: 'Phone number is missing. Please complete your profile by pressing /start again.' });
      }

      if (!userAddress) {
        // Send a Telegram message to the user prompting them to complete their profile
        await sendProfileCompletionMessageToTelegram(userId, 'city');
        return res.status(400).json({ success: false, message: 'City is missing. Please complete your profile by pressing /start again.' });
      }
    }

    // Proceed to create a new order if both phone number and city are available
    const order = await Order.create({
      userId,
      orderItems,
      totalAmount,
      commissionamount,
      commissionStatus: 'pending',  // Set the commission status to "pending"
      address: orderFor === 'other' ? address : userAddress,  // Use the address based on order type
      phoneNumber: userPhoneNumber,  // Use retrieved or provided phone number
      paymentStatus: 'Pending',  // Set payment status to "Pending"
    });

    console.log('Created order:', order);

    // Send order details to Telegram (assuming this function exists)
    await sendOrderNotificationToTelegram(userId, order);

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(400).json({ success: false, message: 'Order creation failed' });
  }
};

// Send a message to Telegram prompting the user to complete their profile
const sendProfileCompletionMessageToTelegram = async (userId, missingField) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || "7316973369:AAGYzlMkYWSgTobE6w7ETkDXrt0aR_a8YMg";
  const chatId = userId;
  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const message = `
    ⚠️ *Profile Incomplete*\n
    Your profile is missing a ${missingField}. Please press /start and update your details to continue placing orders.
  `;

  try {
    await axios.post(apiUrl, {
      chat_id: chatId,
      text: message,
      parse_mode: "Markdown",
    });
  } catch (error) {
    console.error(`Error sending profile completion message to Telegram (${missingField} missing):`, error);
  }
};

// Send a notification message to Telegram with order details
const sendOrderNotificationToTelegram = async (userId, order) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || "7316973369:AAGYzlMkYWSgTobE6w7ETkDXrt0aR_a8YMg";
  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const chatIds = [userId, 302775107, 5074449421];

  // Construct the message content
  let message = `
    🛒 *Order Confirmation*\n
    Order ID: ${order._id}\n`;

  // Only include total amount if it's greater than 0
  if (order.totalAmount > 0) {
    message += `Total Amount: ${order.totalAmount} birr\n`;
  }

  message += `Payment Status: ${order.paymentStatus}\n`;
  message += `Commission: ${order.commissionamount} birr (Pending)\n`;

  // Add order items to the message
  message += `*Order Items:*\n${order.orderItems.map(item => {
    return `- ${item.name} (${item.quantity}x): ${(order.totalAmount / item.quantity).toFixed(2)} birr`;
  }).join('\n')}`;

  // Include address and phone number if provided
  if (order.address && order.phoneNumber) {
    message += `\n\n*Shipping Details:*\nAddress: ${order.address}\nPhone Number: ${order.phoneNumber}\n`;
  }

  console.log('Message to send:', message);

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

export const getallOrders = async (req, res) => {
  try {
    await dbConnect();  // Ensure the database connection is established

    const orders = await Order.find().sort({ createdAt: -1 });
    if (!orders || orders.length === 0) {
      return res.status(404).json({ success: false, message: 'No orders found' });
    }

    return res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ success: false, message: 'Error fetching orders' });
  }
};


export const updatePaymentStatus = async (req, res) => {
  const { orderId, paymentStatus } = req.body;

  try {
    // Ensure DB is connected
    await dbConnect();

    // Find the order by its ID
    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Update the payment status
    order.paymentStatus = paymentStatus;

    // Check if payment is completed and commission is still pending
    if (paymentStatus === 'Completed' && order.commissionStatus === 'pending') {
      // Find the user related to the order
      const user = await User.findOne({ userId: order.userId });
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Add the order's commission to the user's total commission
      user.commission = (user.commission || 0) + order.commissionamount;  // Increment user's commission
      order.commissionStatus = 'completed';  // Mark commission as completed

      // Save the updated user commission
      await user.save();

      // Optionally reward points
      if (!order.pointsRewarded) {
        await rewardUserPoints(order.userId, 2000);  // Reward points only if not rewarded yet
        order.pointsRewarded = true;  // Mark points as rewarded
      }
    }

    // Save the updated order
    await order.save();

    // Respond with the updated order
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
