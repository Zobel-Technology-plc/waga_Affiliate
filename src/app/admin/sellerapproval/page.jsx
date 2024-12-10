/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './SellerApproval.module.css';
import { FaSpinner } from 'react-icons/fa';

const SellerApprovalPage = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPendingUsers = async () => {
      try {
        const response = await axios.get('/api/user?status=pending');
        console.log('Fetched users:', response.data); // Debug log
        setPendingUsers(response.data.data);
      } catch (err) {
        setError('Failed to fetch pending users');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPendingUsers();
  }, []);

  const handleAction = async (userId, action) => {
    try {
      const endpoint = action === 'approve' ? '/api/user/approve' : '/api/user/reject';
      await axios.post(endpoint, { userId });
      setPendingUsers((prev) => prev.filter((user) => user.userId !== userId));
    } catch (err) {
      setError(`Failed to ${action} user`);
      console.error('Error:', err);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingSpinner}>
        <FaSpinner className="animate-spin" size={24} />
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>Seller Approval Requests</h1>
      
      {pendingUsers.length === 0 ? (
        <div className={styles.error}>No pending seller requests</div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>User ID</th>
              <th className={styles.th}>Phone Number</th>
              <th className={styles.th}>City</th>
              <th className={styles.th}>Join Date</th>
              <th className={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingUsers.map((user) => (
              <tr key={user.userId} className={styles.tr}>
                <td className={styles.td}>
                  <div className={styles.userInfo}>
                    <div>
                      <div className={styles.userId}>ID: {user.userId}</div>
                      <div className={styles.points}>Points: {user.points || 0}</div>
                    </div>
                  </div>
                </td>
                <td className={styles.td}>{user.phoneNumber || 'Not provided'}</td>
                <td className={styles.td}>
                  <div className={styles.userLocation}>{user.city || 'Not specified'}</div>
                </td>
                <td className={styles.td}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className={styles.td}>
                  <button
                    onClick={() => handleAction(user.userId, 'approve')}
                    className={`${styles.actionButton} ${styles.approveButton}`}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(user.userId, 'reject')}
                    className={`${styles.actionButton} ${styles.rejectButton}`}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SellerApprovalPage;
