'use client';
import React, { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import axios from 'axios';

const History = () => {
  const [productOrders, setProductOrders] = useState([]);
  const [serviceOrders, setServiceOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [visibleOrders, setVisibleOrders] = useState(3);
  const [activeTab, setActiveTab] = useState('products');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState(null);

  useEffect(() => {
    // Initialize userId from Telegram WebApp SDK
    if (typeof window !== 'undefined' && WebApp.initDataUnsafe.user) {
      setUserId(WebApp.initDataUnsafe.user.id);
    }
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!userId) return;

      try {
        const [productResponse, serviceResponse] = await Promise.all([
          fetch(`/api/orders?userId=${userId}`),
          fetch(`/api/services/serviceorder?userId=${userId}`)
        ]);

        if (!productResponse.ok) {
          throw new Error('Failed to fetch product orders');
        }
        if (!serviceResponse.ok) {
          throw new Error('Failed to fetch service orders');
        }

        const productData = await productResponse.json();
        const serviceData = await serviceResponse.json();

        setProductOrders(productData.data);
        setServiceOrders(serviceData.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userId]);

  const handleShowMore = () => {
    setVisibleOrders((prev) => prev + 3);
  };

  const filteredOrders = activeTab === 'products' ? productOrders : serviceOrders;

  const handleCancelClick = (orderId) => {
    setCancelOrderId(orderId);  // Save the _id for the cancellation request
    setShowCancelConfirm(true); // Show the confirmation modal
  };

  const handleCancelConfirm = async () => {
    try {
      const cancelEndpoint = `/api/orders/${cancelOrderId}/cancel`; // Use the _id in the API request
  
      const response = await axios.put(cancelEndpoint, {
        canceledBy: 'user', // Specify that the cancel request is from a user
      });
  
      if (response.data.success) {
        alert('Order canceled successfully.');
  
        // Update the status of the canceled order in the state
        setProductOrders((orders) =>
          orders.map((order) =>
            order._id === cancelOrderId ? { ...order, status: 'canceled', commissionStatus: 'canceled' } : order
          )
        );
        setServiceOrders((orders) =>
          orders.map((order) =>
            order._id === cancelOrderId ? { ...order, status: 'canceled', commissionStatus: 'canceled' } : order
          )
        );
      } else {
        alert('Failed to cancel the order.');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while canceling the order.');
    } finally {
      setShowCancelConfirm(false);  // Hide the confirmation modal
      setCancelOrderId(null);       // Clear the saved _id
    }
  };
  

  const handleCancelClose = () => {
    setShowCancelConfirm(false);
    setCancelOrderId(null);
  };

  const getStatusStyle = (status) => {
    if (status === 'canceled') return 'text-red-500';
    if (status === 'Completed' || status === 'Complete') return 'text-green-500';
    return 'text-gray-700';
  };

  return (
    <div className="container max-w-screen-xl mx-auto px-4 py-5 mb-10">
      {/* Navigation Bar */}
      <nav className="bg-gray-800 p-4 mb-4">
        <ul className="flex space-x-4">
          <li>
            <button
              onClick={() => setActiveTab('products')}
              className={`ml-14 text-white hover:text-gray-300 ${activeTab === 'products' ? 'font-bold' : ''}`}
            >
              Products
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveTab('services')}
              className={`ml-14 text-white hover:text-gray-300 ${activeTab === 'services' ? 'font-bold' : ''}`}
            >
              Services
            </button>
          </li>
        </ul>
      </nav>

      <h1 className="text-3xl font-semibold mb-4">Order History</h1>
      {loading ? (
        <p>Loading...</p>
      ) : !filteredOrders.length ? (
        <p>No orders found.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredOrders.slice(0, visibleOrders).map((order) => (
            <div key={order._id} className="border border-gray-200 bg-white p-4 rounded shadow-sm relative">
              <h2 className="text-2xl font-semibold mb-2 truncate">
                Order ID: {order.orderId || order.serviceId} {/* Display orderId/serviceId */}
              </h2>
              {order.orderId ? (
                <>
                  <p><strong>Total Amount:</strong> {order.totalAmount} birr</p>
                  <p className={getStatusStyle(order.commissionStatus)}><strong>Status:</strong> {order.commissionStatus}</p>
                  <p><strong>Created At:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                  <ul className="mt-4">
                    {order.orderItems.map((item) => (
                      <li key={item.product} className="mb-2">
                        <p><strong>Product:</strong> {item.name}</p>
                        <p><strong>Quantity:</strong> {item.quantity}</p>
                        <p><strong>Price:</strong> {(item.price * item.quantity).toFixed(2)} birr</p>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <p><strong>Service:</strong> {order.serviceName}</p>
                  <p><strong>City:</strong> {order.city}</p>
                  <p><strong>Phone Number:</strong> {order.phoneNumber}</p>
                  <p><strong>Created At:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                  <p className={getStatusStyle(order.status)}><strong>Status:</strong> {order.status}</p>
                  <p><strong>Order For:</strong> {order.orderFor}</p>
                </>
              )}
              {/* Render Cancel Button only if status is not 'Complete' or 'canceled' */}
              {order.commissionStatus !== 'Complete' && order.commissionStatus !== 'canceled' && (
                <button
                  onClick={() => handleCancelClick(order._id)} // Use _id for cancellation
                  className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                >
                  Cancel
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {visibleOrders < filteredOrders.length && (
        <button onClick={handleShowMore} className="mt-4 mb-10 text-blue-500 hover:underline block text-center mx-auto">
          Show More
        </button>
      )}

      {/* Cancel Confirmation Dialog */}
      {showCancelConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg text-center max-w-sm w-full">
            <p className="text-lg mb-4">Are you sure you want to cancel this order?</p>
            <div className="flex justify-center space-x-4">
              <button onClick={handleCancelConfirm} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                Yes
              </button>
              <button onClick={handleCancelClose} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
