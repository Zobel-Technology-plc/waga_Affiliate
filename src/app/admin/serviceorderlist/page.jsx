'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';
import './services.css'; // Link to the updated CSS

const ServiceOrdersListPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter(); 
  const [serviceorders, setServiceOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [updatedCity, setUpdatedCity] = useState('');
  const [updatedTotalAmount, setUpdatedTotalAmount] = useState('');
  const [completedServiceOrders, setCompletedServiceOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const serviceOrdersPerPage = 20; // Number of service orders displayed per page

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchServiceOrders = async () => {
    try {
      const response = await fetch('/api/services/serviceorder?all=true');
      const data = await response.json();
      if (response.ok) {
        const sortedServiceOrders = data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setServiceOrders(sortedServiceOrders || []);

        const completedOrders = sortedServiceOrders
          .filter(order => order.commissionStatus === 'Complete')
          .map(order => order._id);
        setCompletedServiceOrders(completedOrders);
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Error fetching service orders:', error);
      setError('Failed to fetch service orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceOrders();
  }, []);

  const handleUpdateOrder = async (serviceId) => {
    const updateData = {};
  
    if (updatedCity) updateData.city = updatedCity;
    if (updatedTotalAmount) updateData.totalAmount = updatedTotalAmount;
  
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
  
      if (response.ok) {
        fetchServiceOrders();
        setEditingOrder(null);
      } else {
        console.error('Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const handleCompleteOrder = async (serviceId) => {
    try {
      const response = await fetch(`/api/services/${serviceId}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        setCompletedServiceOrders([...completedServiceOrders, serviceId]);
        fetchServiceOrders();
      } else {
        console.error('Failed to complete order');
      }
    } catch (error) {
      console.error('Error completing order:', error);
    }
  };

  const handleCancelOrder = async (serviceId) => {
    try {
      const response = await fetch(`/api/services/${serviceId}/cancel`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'canceled' }),
      });
      if (response.ok) {
        fetchServiceOrders();
      } else {
        console.error('Failed to cancel order');
      }
    } catch (error) {
      console.error('Error canceling order:', error);
    }
  };

  // Pagination logic
  const indexOfLastOrder = currentPage * serviceOrdersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - serviceOrdersPerPage;
  const currentServiceOrders = serviceorders.slice(indexOfFirstOrder, indexOfLastOrder);

  const nextPage = () => setCurrentPage(currentPage + 1);
  const prevPage = () => setCurrentPage(currentPage - 1);

  if (loading) return <p>Loading service orders...</p>;
  if (!session) {
    return (
      <div>
        <p>You need to be logged in to view orders.</p>
        <button onClick={() => signIn()}>Login</button>
      </div>
    );
  }
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      {serviceorders.length > 0 ? (
        <>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Service ID</th>
                  <th>Service</th>
                  <th>Phone Number</th>
                  <th>City</th>
                  <th>Order For</th>
                  <th>Status</th>
                  <th>Points</th>
                  <th>Time</th>
                  <th>Date</th>
                  <th>Total Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentServiceOrders.map((order, index) => (
                  <tr key={order._id}>
                    <td>{indexOfFirstOrder + index + 1}</td>
                    <td>{order.serviceId}</td>
                    <td>{order.serviceName}</td>
                    <td>
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
                          placeholder={order.city}
                        />
                      ) : (
                        order.city || 'N/A'
                      )}
                    </td>
                    <td>{order.orderFor}</td>
                    <td>{order.commissionStatus}</td>
                    <td>{order.points}</td>
                    <td>{new Date(order.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric' })}</td>
                    <td>{new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}</td>
                    <td>{editingOrder === order._id ? (
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
                    {/* Conditionally hide actions if the order is canceled */}
                    {order.commissionStatus !== 'canceled' && (
                      <td>
                        <div className="action-buttons">
                          {editingOrder === order._id ? (
                            <>
                              <button className="save-btn" onClick={() => handleUpdateOrder(order._id)}>Save</button>
                              <button className="cancel-btn" onClick={() => setEditingOrder(null)}>Cancel</button>
                            </>
                          ) : (
                            <>
                              <button className="update-btn" onClick={() => setEditingOrder(order._id)}>Update</button>
                              <button
                                className={completedServiceOrders.includes(order._id) ? 'completed-btn' : 'complete-btn'}
                                onClick={() => !completedServiceOrders.includes(order._id) && handleCompleteOrder(order._id)}
                              >
                                {completedServiceOrders.includes(order._id) ? 'Completed' : 'Complete'}
                              </button>
                              <button
                                className="cancel-order-btn red"
                                onClick={() => handleCancelOrder(order._id)}
                                disabled={order.commissionStatus === 'canceled'}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="pagination">
            <button onClick={prevPage} disabled={currentPage === 1}
              className={`px-4 py-2 rounded ${currentPage === 1 ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-800 text-white'}`}>
              Previous
            </button>
            <button onClick={nextPage} disabled={indexOfLastOrder >= serviceorders.length}
              className={`px-4 py-2 rounded ${indexOfLastOrder >= serviceorders.length ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-800 text-white'}`}>
              Next
            </button>
          </div>
        </>
      ) : (
        <p>No service orders found.</p>
      )}
    </div>
  );
};

export default ServiceOrdersListPage;
