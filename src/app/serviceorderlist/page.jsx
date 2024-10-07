'use client';
import { useEffect, useState } from 'react';
import './services.css';

const ServiceOrdersListPage = () => {
  const [serviceorders, setserviceorders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [updatedCity, setUpdatedCity] = useState('');
  const [updatedCommission, setUpdatedCommission] = useState('');
  const [updatedTotalAmount, setUpdatedTotalAmount] = useState('');
  const [completedserviceorders, setCompletedserviceorders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const serviceordersPerPage = 20; // Number of serviceorders displayed per page

  const fetchserviceorders = async () => {
    try {
      const response = await fetch('/api/services/serviceorder?all=true');
      const data = await response.json();
      if (response.ok) {
        const sortedserviceorders = data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setserviceorders(sortedserviceorders || []);

        // Set the completed orders into the state
        const completedOrders = sortedserviceorders
          .filter(order => order.commissionStatus === 'Complete')
          .map(order => order._id);
        setCompletedserviceorders(completedOrders);
      } else {
        setError(data.message);
      }
    } catch (error) {
      console.error('Error fetching serviceorders:', error);
      setError('Failed to fetch serviceorders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchserviceorders();
  }, []);

  const handleUpdateOrder = async (serviceId) => {
    // Prepare an object to hold the fields to be updated
    const updateData = {};
  
    // Only include fields that have been updated
    if (updatedCity) updateData.city = updatedCity;
    if (updatedCommission) updateData.commission = updatedCommission;
    if (updatedTotalAmount) updateData.totalAmount = updatedTotalAmount;
  
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData), // Only send the updated fields
      });
  
      if (response.ok) {
        fetchserviceorders(); // Refresh the list after successful update
        setEditingOrder(null); // Reset editing state
      } else {
        console.error('Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };
  

  const handleCompleteOrder = async (serviceId, userId, points) => {
    console.log(`Completing order with id: ${serviceId}`); // Add this line to check the serviceId
    try {
      const response = await fetch(`/api/services/${serviceId}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId, // Send the userId to update commission
          points
        }),
      });
      if (response.ok) {
        setCompletedserviceorders([...completedserviceorders, serviceId]); // Mark order as completed in state
        fetchserviceorders(); // Refresh the list after completion
      } else {
        console.error('Failed to complete order');
      }
    } catch (error) {
      console.error('Error completing order:', error);
    }
  };
  

  // Pagination logic
  const indexOfLastOrder = currentPage * serviceordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - serviceordersPerPage;
  const currentserviceorders = serviceorders.slice(indexOfFirstOrder, indexOfLastOrder);

  const nextPage = () => setCurrentPage(currentPage + 1);
  const prevPage = () => setCurrentPage(currentPage - 1);

  if (loading) return <p>Loading serviceorders...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      {serviceorders.length > 0 ? (
        <>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>ServiceID</th>
                <th>Service</th>
                <th>PhoneNumber</th>
                <th>City</th>
                <th>Orderfor</th>
                <th>Commission</th>
                <th>CommissionStatus</th>
                <th>PaymentStatus</th>
                <th>Points</th>
                <th>Date</th>
                <th>Total Amount</th>
                
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentserviceorders.map((order, index) => (
                <tr key={order._id}>
                  <td>{indexOfFirstOrder + index + 1}</td>
                  <td>{order.serviceId}</td>
                  <td>{order.serviceName}</td>
                  <td>{order.phoneNumber}</td>
                  <td>{editingOrder === order._id ? (
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
                  <td>{editingOrder === order._id ? (
                      <input
                        type="number"
                        value={updatedCommission}
                        onChange={(e) => setUpdatedCommission(e.target.value)}
                        placeholder={order.commissionamount}
                      />
                    ) : (
                      order.commission 
                    )} %
                  </td>
                  <td>{order.commissionStatus}</td>
                  <td>{order.status}</td>
                  <td>{order.points}</td>
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
                          className={completedserviceorders.includes(order._id) ? 'complete-btn gray' : 'complete-btn blue'}
                          onClick={() => !completedserviceorders.includes(order._id) && handleCompleteOrder(order._id)}
                        >
                          {completedserviceorders.includes(order._id) ? 'Completed' : 'Complete'}
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
            <button onClick={nextPage} disabled={indexOfLastOrder >= serviceorders.length}>Next</button>
          </div>
        </>
      ) : (
        <p>No service orders found.</p>
      )}
    </div>
  );
};

export default ServiceOrdersListPage;
