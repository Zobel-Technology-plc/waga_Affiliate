'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import styles from './UserActionsPage.module.css';

const UserActionsPage = () => {
  const { userId } = useParams();
  const [activeTab, setActiveTab] = useState('actions'); // Tab management
  const [actions, setActions] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [canceledOrders, setCanceledOrders] = useState([]);
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

        setActions(actionsResponse.data.actions || []);

        const allOrders = [
          ...productOrdersResponse.data.data,
          ...serviceOrdersResponse.data.data,
        ];

        setCompletedOrders(allOrders.filter((order) => order.commissionStatus === 'Complete'));
        setCanceledOrders(allOrders.filter((order) => order.status === 'canceled'));
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

  const uniqueActions = [];
  const actionMap = new Map();

  actions.forEach((action) => {
    if (!actionMap.has(action.action) || action.points) {
      actionMap.set(action.action, action);
    }
  });

  actionMap.forEach((action) => uniqueActions.push(action));
  uniqueActions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const totalPoints = uniqueActions.reduce((sum, action) => sum + (action.points || 0), 0);

  const renderOrdersTable = (orders) => (
    <table className={styles.table}>
      <thead>
        <tr className={styles.tr}>
          <th className={styles.th}>Order Type</th>
          <th className={styles.th}>Order Details</th>
          <th className={styles.th}>Total Amount</th>
          <th className={styles.th}>Status</th>
          <th className={styles.th}>Created At</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order, index) => (
          <tr key={index} className={styles.tr}>
            <td className={styles.td}>{order.orderId ? 'Product' : 'Service'}</td>
            <td className={styles.td}>
              {order.orderId ? (
                <ul className={styles.productList}>
                  {order.orderItems.map((item) => (
                    <li key={item._id} className={styles.productItem}>
                      {item.name} ({item.quantity} × {new Intl.NumberFormat().format(item.price)} birr)
                    </li>
                  ))}
                </ul>
              ) : (
                <>
                  <p><strong>Service:</strong> {order.serviceName}</p>
                  <p><strong>City:</strong> {order.city}</p>
                  <p><strong>Phone:</strong> {order.phoneNumber}</p>
                </>
              )}
            </td>
            <td className={styles.td}>
              {order.totalAmount
                ? `${order.totalAmount} birr`
                : `${order.servicePrice || 0} birr`}
            </td>
            <td className={styles.td}>{order.status}</td>
            <td className={styles.td}>{new Date(order.createdAt).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

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
              {uniqueActions.map((action, index) => (
                <tr key={index} className={styles.tr}>
                  <td className={styles.td}>{index + 1}</td>
                  <td className={styles.td}>{action.joinerUserId}</td>
                  <td className={styles.td}>{action.action}</td>
                  <td className={styles.td}>{new Intl.NumberFormat().format(action.points || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else if (activeTab === 'completed') {
      return renderOrdersTable(completedOrders);
    } else if (activeTab === 'canceled') {
      return renderOrdersTable(canceledOrders);
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
          onClick={() => setActiveTab('completed')}
          className={`text-white ${activeTab === 'completed' ? 'font-bold underline' : ''}`}
        >
          Completed
        </button>
        <button
          onClick={() => setActiveTab('canceled')}
          className={`text-white ${activeTab === 'canceled' ? 'font-bold underline' : ''}`}
        >
          Canceled
        </button>
      </nav>

      {/* Render Content */}
      {renderContent()}
    </div>
  );
};

export default UserActionsPage;
