'use client';
import { useEffect, useState } from 'react';
import './oderlist.css'; // Ensure you link the updated CSS file

const OrdersListPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [updatedCity, setUpdatedCity] = useState('');
  const [updatedCommission, setUpdatedCommission] = useState('');
  const [updatedTotalAmount, setUpdatedTotalAmount] = useState('');
  const [completedOrders, setCompletedOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10; // Number of orders displayed per page

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders?all=true');
      const data = await response.json();
      if (response.ok) {
        // Sort orders by `createdAt`, most recent first
        const sortedOrders = data.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(sortedOrders || []);

        // Find completed orders from fetched data
        const completed = sortedOrders
          .filter((order) => order.commissionStatus === 'completed')
          .map((order) => order._id);
        setCompletedOrders(completed); // Save completed orders to state
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
    fetchOrders();
  }, []);

  // Handle updating an order (e.g., city, commission, totalAmount)
  const handleUpdateOrder = async (orderId) => {
    const updateData = {};
  
    if (updatedCity) updateData.city = updatedCity;
    if (updatedCommission) updateData.commission = updatedCommission;
    if (updatedTotalAmount) updateData.totalAmount = updatedTotalAmount;
  
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      if (response.ok) {
        fetchOrders(); // Refresh the list after successful update
        setEditingOrder(null); // Reset editing state
      } else {
        console.error('Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };
  

  // Handle completing an order (including adding commission to the user)
  const handleCompleteOrder = async (orderId, userId, commissionAmount) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId, // Send the userId to update commission
          commissionAmount, // Pass the commission amount to be added to the user
        }),
      });
      if (response.ok) {
        setCompletedOrders([...completedOrders, orderId]); // Mark order as completed
        fetchOrders(); // Refresh the list after completion
      } else {
        console.error('Failed to complete order');
      }
    } catch (error) {
      console.error('Error completing order:', error);
    }
  };

  // Pagination logic
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);

  const nextPage = () => setCurrentPage(currentPage + 1);
  const prevPage = () => setCurrentPage(currentPage - 1);

  if (loading) return <p>Loading orders...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      {orders.length > 0 ? (
        <>
          <table>
            <thead>
              <tr>
                <th>#</th> {/* Add a header for numbering */}
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
                <tr key={order._id}>
                  <td>{indexOfFirstOrder + index + 1}</td> {/* Display the order number */}
                  <td>{order.orderId}</td>
                  <td>
                    {/* Make phone number clickable */}
                    <a href={`tel:${order.phoneNumber}`}>
                      {order.phoneNumber}
                    </a>
                  </td>
                  <td>
                    {editingOrder === order._id ? (
                      <input
                        type="text"
                        value={updatedCity}
                        onChange={(e) => setUpdatedCity(e.target.value)}
                        placeholder={order.address}
                      />
                    ) : (
                      order.address || 'N/A'
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
                  <td>{order.commissionStatus}</td>
                  <td>
                    <ul>
                      {order.orderItems.map((item) => (
                        <li key={item.product}>
                          {item.name} - {item.quantity} x {item.price}
                        </li>
                      ))}
                    </ul>
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
                    {editingOrder === order._id ? (
                      <>
                        <button className="save-btn" onClick={() => handleUpdateOrder(order._id)}>Save</button>
                        <button className="cancel-btn" onClick={() => setEditingOrder(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="update-btn" onClick={() => setEditingOrder(order._id)}>Update</button>
                        <button
                          className={completedOrders.includes(order._id) ? 'complete-btn gray' : 'complete-btn blue'}
                          onClick={() => !completedOrders.includes(order._id) && handleCompleteOrder(order._id, order.userId, order.commissionamount)}
                        >
                          {completedOrders.includes(order._id) ? 'Completed' : 'Complete'}
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Controls */}
          <div className="pagination">
            <button onClick={prevPage} disabled={currentPage === 1}>Previous</button>
            <button onClick={nextPage} disabled={indexOfLastOrder >= orders.length}>Next</button>
          </div>
        </>
      ) : (
        <p>No orders found.</p>
      )}
    </div>
  );
};

export default OrdersListPage;
