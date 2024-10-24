import Order from '../models/order';
import User from '../models/user';
import axios from 'axios';
import dbConnect from '../../backend/config/dbConnect';
import moment from 'moment';

export const newOrder = async (req, res) => {
  const { userId, orderItems, totalAmount, commissionamount, city, phoneNumber, orderFor } = req.body;

  try {
    let userPhoneNumber = phoneNumber;
    let userCity = city;

    // Handle "self" orders by fetching user's phone number and city
    if (orderFor === 'self') {
      const user = await User.findOne({ userId });

      // If the user is not found, return an error
      if (!user) {
        return res.status(400).json({ success: false, message: 'User not found.' });
      }

      // Use the user's profile phone number and city if not provided in the request body
      userPhoneNumber = user.phoneNumber || phoneNumber;
      userCity = user.city || city;

      // Check if the phone number or city is missing in the user's profile
      if (!userPhoneNumber) {
        // Send a Telegram message to the user prompting them to complete their profile
        await sendProfileCompletionMessageToTelegram(userId, 'phone number');
        return res.status(400).json({ success: false, message: 'Phone number is missing. Please complete your profile by pressing /start again.' });
      }

      if (!userCity) {
        // Send a Telegram message to the user prompting them to complete their profile
        await sendProfileCompletionMessageToTelegram(userId, 'city');
        return res.status(400).json({ success: false, message: 'City is missing. Please complete your profile by pressing /start again.' });
      }
    }

    // Handle "other" orders: ensure both city and phone number are provided
    if (orderFor === 'other' && (!city || !phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'City and Phone Number are required for other orders.',
      });
    }

    const orderId = nanoid(7);

    // Create a new order
    const order = await Order.create({
      userId,
      orderId:orderId,
      orderItems,
      totalAmount,
      commissionamount,
      commissionStatus: 'pending',  // Set commission status to "pending"
      city: userCity,  // Use city from the user's profile or the provided one
      phoneNumber: userPhoneNumber,  // Use phone number from the user's profile or the provided one
      orderFor,
      paymentStatus: 'Pending',  // Set payment status to "Pending"
    });

    // Send order details to Telegram (assuming this function exists)
    await sendOrderNotificationToTelegram(userId, order);

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(400).json({ success: false, message: 'Order creation failed.' });
  }
};

// Function to send a Telegram message prompting the user to complete their profile
const sendProfileCompletionMessageToTelegram = async (userId, missingField) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = userId;
  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const message = `
    ⚠️ *Profile Incomplete*\n
    Your ${missingField} is missing. Please update your profile by pressing /start.
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

// Function to send order notification to Telegram
const sendOrderNotificationToTelegram = async (userId, order) => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN || "7316973369:AAGYzlMkYWSgTobE6w7ETkDXrt0aR_a8YMg";
  const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const chatIds = [userId, 302775107, 5074449421];

  // Construct the message content
  let message = `
    🛒 *Order Confirmation*\n
    Order ID: ${order.orderId}\n`;

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
  if (order.city && order.phoneNumber) {
    message += `\n\n*Shipping Details:*\nAddress: ${order.city}\n Phone Number: ${order.phoneNumber}\n`;
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

    // Fetch all orders and sort them by creation date (most recent first)
    const orders = await Order.find().sort({ createdAt: -1 });

    // If no orders are found, return a 404 response
    if (!orders || orders.length === 0) {
      return res.status(404).json({ success: false, message: 'No orders found' });
    }

    // Return the total count of orders along with the order data
    return res.status(200).json({ 
      success: true, 
      count: orders.length,  // Total number of orders
      orders  // The actual order data
    });
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


export const getPendingCommissions = async (req, res) => {
  try {
    // Fetch pending orders with commissionAmount and commissionStatus fields
    const pendingOrders = await Order.find({ commissionStatus: 'complete' })
                                     .select('commissionamount commissionStatus');

    // Calculate the total commission amount by summing over the pending orders
    const totalCommissionAmount = pendingOrders.reduce((acc, order) => {
      return acc + (order.commissionamount || 0); // Add commissionAmount if it exists, else 0
    }, 0);

    // Log the total commission amount to the console
    console.log('Total Complete Commission Amount:', totalCommissionAmount);

    // Respond with the pending orders and the total commission amount
    res.status(200).json({
      success: true,
      count: pendingOrders.length,
      totalCommissionAmount, // Include total commission in the response
      orders: pendingOrders,
    });
  } catch (error) {
    console.error('Error fetching complete commissions:', error);
    res.status(500).json({ success: false, message: 'Error fetching pending commissions' });
  }
};

export const getPendingOrders = async (req, res) => {
  try {
    await dbConnect();  // Ensure the database connection is established

    // Fetch all orders and sort them by creation date (most recent first)
    const orders = await Order.find({ commissionStatus: 'pending' })
                                     .select('commissionamount commissionStatus');

    // If no orders are found, return a 404 response
    if (!orders || orders.length === 0) {
      return res.status(404).json({ success: false, message: 'No orders found' });
    }

    // Return the total count of orders along with the order data
    return res.status(200).json({ 
      success: true, 
      count: orders.length,  // Total number of orders
      orders  // The actual order data
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return res.status(500).json({ success: false, message: 'Error fetching orders' });
  }
};

export const getOrdersFromLast30Days = async (req, res) => {
  try {
    const thirtyDaysAgo = moment().subtract(30, 'days').toDate();
    const orders = await Order.find({ createdAt: { $gte: thirtyDaysAgo } });
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error('Error fetching orders from last 30 days:', error);
    res.status(500).json({ success: false, message: 'Error fetching orders from last 30 days' });
  }
};
