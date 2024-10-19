'use client';
import React, { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';

const History = () => {
  const [productOrders, setProductOrders] = useState([]);
  const [serviceOrders, setServiceOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [visibleOrders, setVisibleOrders] = useState(3);
  const [activeTab, setActiveTab] = useState('products');

  useEffect(() => {
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
            <div key={order.orderId || order.serviceId} className="border border-gray-200 bg-white p-4 rounded shadow-sm">
              <h2
                className="text-2xl font-semibold mb-2 truncate"
                style={{
                  overflowX: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                Order ID: {order.orderId || order.serviceId}
              </h2>
              {order.orderId ? (
                <>
                  <p><strong>Total Amount:</strong> {order.totalAmount} birr</p>
                  <p><strong>Status:</strong> {order.paymentStatus}</p>
                  <p><strong>Created At:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                  <ul className="mt-4">
                    {order.orderItems.map((item) => (
                      <li key={item.product} className="mb-2">
                        <p><strong>Product:</strong> {item.name}</p>
                        <p><strong>Quantity:</strong> {item.quantity}</p>
                        {(order.totalAmount / item.quantity).toFixed(2) > 0 && (
      <p><strong>Price:</strong> {(order.totalAmount).toFixed(2)} birr</p>
    )}
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
                  <p><strong>Status:</strong> {order.status}</p>
                  <p><strong>orderFor:</strong> {order.orderFor}</p>
                </>
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
    </div>
  );
};

export default History;
