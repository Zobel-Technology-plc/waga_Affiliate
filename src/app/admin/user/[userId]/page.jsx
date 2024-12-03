'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import styles from './UserActionsPage.module.css';

const UserActionsPage = () => {
  const { userId } = useParams();
  const [activeTab, setActiveTab] = useState('actions'); // Tab management
  const [actions, setActions] = useState([]);
  const [productOrders, setProductOrders] = useState([]);
  const [serviceOrders, setServiceOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [actionsResponse, productOrdersResponse, serviceOrdersResponse] = await Promise.all([
          axios.get(`/api/user/actions?userId=${userId}`),
          axios.get(`/api/orders?userId=${userId}`),
          axios.get(`/api/services/serviceorder?userId=${userId}`),
        ]);

        // Set fetched data
        setActions(actionsResponse.data.actions || []);
        setProductOrders(productOrdersResponse.data.data || []);
        setServiceOrders(serviceOrdersResponse.data.data || []);
      } catch (error) {
        setError('Error fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  // Prepare unique actions
  const uniqueActions = [];
  const actionMap = new Map();

  actions.forEach((action) => {
    if (!actionMap.has(action.action) || action.points) {
      actionMap.set(action.action, action);
    }
  });

  actionMap.forEach((action) => uniqueActions.push(action));
  uniqueActions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by timestamp

  const totalPoints = uniqueActions.reduce((sum, action) => sum + (action.points || 0), 0);

  // Render content based on the active tab
  const renderContent = () => {
    if (activeTab === 'actions') {
      return (
        <div>
          <div className={styles.totalPoints}>
            <p>
              <strong>Total Points:</strong> {new Intl.NumberFormat().format(totalPoints)}
            </p>
          </div>
          <table className={styles.table}>
            <thead>
              <tr className={styles.tr}>
                <th className={styles.th}>Number</th>
                <th className={styles.th}>User ID</th>
                <th className={styles.th}>Action</th>
                <th className={styles.th}>Points</th>
              </tr>
            </thead>
            <tbody>
              {uniqueActions
                .filter((action) => !isNaN(action.points)) // Filter valid points
                .map((action, index) => (
                  <tr key={index} className={styles.tr}>
                    <td className={styles.td}>{index + 1}</td>
                    <td className={styles.td}>{action.joinerUserId}</td>
                    <td className={styles.td}>{action.action}</td>
                    <td className={styles.td}>{new Intl.NumberFormat().format(action.points)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      );
    } else if (activeTab === 'products') {
      return (
        <table className={styles.table}>
          <thead>
            <tr className={styles.tr}>
              <th className={styles.th}>Order ID</th>
              <th className={styles.th}>Order Item</th>
              <th className={styles.th}>Total Amount</th>
              <th className={styles.th}>Status</th>
              <th className={styles.th}>Created At</th>
            </tr>
          </thead>
          <tbody>
            {productOrders.map((order, index) => (
              <tr key={index} className={styles.tr}>
                <td className={styles.td}>{order.orderId}</td>
                <td className={styles.td}>
                  <ul className={styles.productList}>
                    {order.orderItems.map((item) => (
                      <li key={item._id} className={styles.productItem}>
                        {item.name} ({item.quantity} × {new Intl.NumberFormat().format(item.price)} birr)
                      </li>
                    ))}
                  </ul>
                </td>
                <td className={styles.td}>{order.totalAmount} birr</td>
                <td className={styles.td}>{order.commissionStatus}</td>
                <td className={styles.td}>{new Date(order.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else if (activeTab === 'services') {
      return (
        <table className={styles.table}>
          <thead>
            <tr className={styles.tr}>
              <th className={styles.th}>Service Name</th>
              <th className={styles.th}>City</th>
              <th className={styles.th}>Phone Number</th>
              <th className={styles.th}>Created At</th>
              <th className={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {serviceOrders.map((order, index) => (
              <tr key={index} className={styles.tr}>
                <td className={styles.td}>{order.serviceName}</td>
                <td className={styles.td}>{order.city}</td>
                <td className={styles.td}>{order.phoneNumber}</td>
                <td className={styles.td}>{new Date(order.createdAt).toLocaleString()}</td>
                <td className={styles.td}>{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>User Details for {userId}</h1>

      {/* Navigation Tabs */}
      <nav className="flex justify-around bg-gray-800 p-4 mb-4">
        <button
          onClick={() => setActiveTab('actions')}
          className={`text-white ${activeTab === 'actions' ? 'font-bold underline' : ''}`}
        >
          Actions
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`text-white ${activeTab === 'products' ? 'font-bold underline' : ''}`}
        >
          Product Orders
        </button>
        <button
          onClick={() => setActiveTab('services')}
          className={`text-white ${activeTab === 'services' ? 'font-bold underline' : ''}`}
        >
          Service Orders
        </button>
      </nav>

      {/* Render Content */}
      {renderContent()}
    </div>              
  );
};

export default UserActionsPage;
