import Order from '../models/order';
import User from '../models/user';
import axios from 'axios';
import dbConnect from '../../backend/config/dbConnect';

// Create a new order
export const newOrder = async (req, res) => {
  const { userId, orderItems, totalAmount, commissionamount, address, phoneNumber, orderFor } = req.body;

  console.log('Request body:', req.body);

  try {
    // Initialize variables to hold the final phone number and address values
    let userPhoneNumber = phoneNumber;
    let userCity = address;  // Address will hold the city for self or other orders

    // Fetch user data if the order is for "self"
    if (orderFor === 'self') {
      const user = await User.findOne({ userId });

      // Validate that the user exists and has a phone number and city saved in their profile
      if (!user || !user.phoneNumber || !user.city) {
        await sendProfileCompletionMessageToTelegram(userId);
        return res.status(400).json({
          success: false,
          message: 'Phone number and city are required for self orders but not found in the user profile. Please complete your registration.',
        });
      }

      // Use the user's saved phone number and city
      userPhoneNumber = user.phoneNumber;
      userCity = user.city;
    }

    // Validate city and phone number for 'other' orders
    if (orderFor === 'other' && (!address || !phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'City and Phone Number are required when ordering for others.',
      });
    }

    // Proceed to create a new order
    const order = await Order.create({
      userId,
      orderItems,
      totalAmount,
      commissionamount,
      commissionStatus: 'pending',
      address: userCity,  // Use the user's city for "self" or the provided city for "other"
      phoneNumber: userPhoneNumber,  // Use the user's phone number for "self" or the provided one for "other"
      paymentStatus: 'Pending',
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

// Function to send a Telegram message prompting the user to complete their profile
const sendProfileCompletionMessageToTelegram = async (userId) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || '7316973369:AAGYzlMkYWSgTobE6w7ETkDXrt0aR_a8YMg';
  const chatId = userId;
  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const message = `
    ⚠️ *Profile Incomplete*\n
    ውድ ደንበኛችን፤ ስልክ ቁጥር ወይም ከተማዎትን አላስገቡም፤ እባክዎትን /start የሚለውን በመጫን ምዝገባዎትን ያጠናቁ፡፡
  `;

  try {
    await axios.post(apiUrl, {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
    });
    console.log(`Profile completion message sent to user: ${userId}`);
  } catch (error) {
    console.error(`Error sending profile completion message to Telegram (${userId}):`, error);
  }
};

// Send a notification message to Telegram with order details
const sendOrderNotificationToTelegram = async (userId, order) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || '7316973369:AAGYzlMkYWSgTobE6w7ETkDXrt0aR_a8YMg';
  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const chatIds = [userId, 302775107, 5074449421];

  let message = `
    🛒 *Order Confirmation*\n
    Order ID: ${order._id}\n
    Total Amount: ${order.totalAmount} birr\n
    Payment Status: ${order.paymentStatus}\n
    Commission: ${order.commissionamount} birr (Pending)\n
    Shipping Details:\nAddress: ${order.address}\nPhone Number: ${order.phoneNumber}\n
  `;

  for (const chatId of chatIds) {
    try {
      await axios.post(apiUrl, {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
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
