/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './CompletePage.module.css';

const CompletePage = () => {
  const [pendingCommissions, setPendingCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPendingCommissions = async () => {
      try {
        const response = await axios.get('/api/orders?commissionComplete=true');
        if (response.data.success) {
          setPendingCommissions(response.data.orders); // Assuming the data is in `orders` key
        } else {
          setError(response.data.message);
        }
      } catch (err) {
        setError('Failed to fetch pending commissions.');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingCommissions();
  }, []);

  if (loading) return <p>Loading pending commissions...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Completed Commissions</h1>
      {pendingCommissions.length === 0 ? (
        <p>No completed commissions found.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>User ID</th>
              <th>Products</th>
              <th>Commission Amount</th>
              <th>Status</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {pendingCommissions.map((order) => (
              <tr key={order.orderId}>
                <td>{order.orderId}</td>
                <td>{order.userId}</td>
                <td>
                  <ul className={styles.productList}>
                    {order.orderItems.map((item) => (
                      <li key={item._id} className={styles.productItem}>
                        {item.name} ({item.quantity} × {new Intl.NumberFormat().format(item.price)} birr)
                      </li>
                    ))}
                  </ul>
                </td>
                <td>{new Intl.NumberFormat().format(order.commissionamount)} birr</td>
                <td>{order.commissionStatus}</td>
                <td>{new Date(order.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CompletePage;
