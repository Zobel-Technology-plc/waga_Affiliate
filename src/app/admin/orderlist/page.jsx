'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import './orderlist.css'; // Ensure you link the updated CSS file

const OrdersListPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [expandedRow, setExpandedRow] = useState(null); // For toggling order details
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [updatedCity, setUpdatedCity] = useState('');
  const [updatedCommission, setUpdatedCommission] = useState('');
  const [updatedTotalAmount, setUpdatedTotalAmount] = useState('');
  const [completedOrders, setCompletedOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Toggle row expansion
  const toggleRow = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  // Fetch orders from the backend
  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders?all=true');
      const data = await response.json();
      if (response.ok) {
        // Filter out orders with a "pending" commission status
        const pendingOrders = data.orders.filter(order => order.commissionStatus === 'pending');
        const sortedOrders = pendingOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(sortedOrders || []);
        const completed = sortedOrders
          .filter((order) => order.commissionStatus === 'completed')
          .map((order) => order._id);
        setCompletedOrders(completed);
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to fetch orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchOrders();
    }
  }, [session]);

  // Handle updating an order (e.g., city, commission, totalAmount)
  const handleUpdateOrder = async (orderId) => {
    const updateData = {};
    if (updatedCity) updateData.city = updatedCity;
    if (updatedCommission) updateData.commission = updatedCommission;
    if (updatedTotalAmount) updateData.totalAmount = updatedTotalAmount;

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });
      if (response.ok) {
        fetchOrders();
        setEditingOrder(null);
      } else {
        console.error('Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  // Handle completing an order
  const handleCompleteOrder = async (orderId, userId, commissionAmount) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, commissionAmount }),
      });
      if (response.ok) {
        setCompletedOrders([...completedOrders, orderId]);
        fetchOrders();
      } else {
        console.error('Failed to complete order');
      }
    } catch (error) {
      console.error('Error completing order:', error);
    }
  };

  // Handle canceling an order
  const handleCancelOrder = async (orderId) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        fetchOrders(); // Refresh orders after canceling
      } else {
        console.error('Failed to cancel order');
      }
    } catch (error) {
      console.error('Error canceling order:', error);
    }
  };

  // Pagination logic
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);

  const nextPage = () => setCurrentPage(currentPage + 1);
  const prevPage = () => setCurrentPage(currentPage - 1);

  if (status === 'loading') return <p>Loading session...</p>;
  if (!session) return <p>You need to be logged in to view orders. <button onClick={() => signIn()}>Login</button></p>;
  if (loading) return <p>Loading orders...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="flex-1 p-6">
      {orders.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Order ID</th>
                  <th>Phone Number</th>
                  <th>City</th>
                  <th>Commission</th>
                  <th>Commission Status</th>
                  <th>Order Items</th>
                  <th>Time</th>
                  <th>Date</th>
                  <th>Total Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentOrders.map((order, index) => (
                  <React.Fragment key={order._id}>
                    <tr>
                      <td>{indexOfFirstOrder + index + 1}</td>
                      <td>{order.orderId}</td>
                      <td><a href={`tel:${order.phoneNumber}`}>{order.phoneNumber}</a></td>
                      <td>
                        {editingOrder === order._id ? (
                          <input
                            type="text"
                            value={updatedCity}
                            onChange={(e) => setUpdatedCity(e.target.value)}
                            placeholder={order.city}
                          />
                        ) : (
                          order.city || 'N/A'
                        )}
                      </td>
                      <td>
                        {editingOrder === order._id ? (
                          <input
                            type="number"
                            value={updatedCommission}
                            onChange={(e) => setUpdatedCommission(e.target.value)}
                            placeholder={order.commissionamount}
                          />
                        ) : (
                          order.commissionamount
                        )}
                      </td>
                      <td>{order.commissionStatus === 'canceled' ? 'Canceled' : order.commissionStatus}</td>
                      <td>
                        <button className='text-black' onClick={() => toggleRow(index)}>
                          {expandedRow === index ? '-' : '+'}
                        </button>
                      </td>
                      <td>{new Date(order.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' })}</td>
                      <td>{new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}</td>
                      <td>
                        {editingOrder === order._id ? (
                          <input
                            type="number"
                            value={updatedTotalAmount}
                            onChange={(e) => setUpdatedTotalAmount(e.target.value)}
                            placeholder={order.totalAmount}
                          />
                        ) : (
                          order.totalAmount > 0 ? order.totalAmount : 'N/A'
                        )}
                      </td>
                      <td>
                        {/* Conditionally hide actions if order is canceled */}
                        {order.commissionStatus !== 'canceled' && (
                          <div className="action-buttons">
                            {editingOrder === order._id ? (
                              <>
                                <button className="save-btn" onClick={() => handleUpdateOrder(order._id)}>Save</button>
                                <button className="cancel-btn" onClick={() => setEditingOrder(null)}>Cancel</button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="update-btn"
                                  onClick={() => setEditingOrder(order._id)}
                                  disabled={order.commissionStatus === 'canceled'}
                                >
                                  Update
                                </button>
                                <button
                                  className={completedOrders.includes(order._id) ? 'completed-btn' : 'complete-btn'}
                                  onClick={() => handleCompleteOrder(order._id, order.userId, order.commissionamount)}
                                  disabled={completedOrders.includes(order._id) || order.commissionStatus === 'canceled'}
                                >
                                  {completedOrders.includes(order._id) ? 'Completed' : 'Complete'}
                                </button>
                                <button
                                  className="cancel-order-btn red"
                                  onClick={() => handleCancelOrder(order._id)}
                                  disabled={order.commissionStatus === 'canceled'}
                                >
                                  {order.commissionStatus === 'canceled' ? 'Canceled' : 'Cancel'}
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>

                    {expandedRow === index && (
                      <tr>
                        <td colSpan="12">
                          <div className="bg-gray-100 p-4">
                            <h4>Order Items</h4>
                            <ul>
                              {order.orderItems ? (
                                <ul>
                                  {order.orderItems.map((item, i) => (
                                    <li key={i}>{item.name} - {item.quantity}</li>
                                  ))}
                                </ul>
                              ) : (
                                <p>No items found</p>
                              )}
                            </ul>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between mt-4">
            <button
              className={`px-4 py-2 rounded ${currentPage === 1 ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-800 text-white'}`}
              onClick={prevPage}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <button
              className={`px-4 py-2 rounded ${indexOfLastOrder >= orders.length ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-800 text-white'}`}
              onClick={nextPage}
              disabled={indexOfLastOrder >= orders.length}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <p>No orders found.</p>
      )}
    </div>
  );
};

export default OrdersListPage;
