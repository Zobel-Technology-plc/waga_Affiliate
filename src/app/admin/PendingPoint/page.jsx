'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './PendingPointPage.module.css';

const PendingPointPage = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPendingRequests = async () => {
      try {
        const response = await axios.get('/api/conversionRecords?status=pending');
        setPendingRequests(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching pending requests:', error);
        setError('Failed to fetch pending requests.');
        setLoading(false);
      }
    };

    fetchPendingRequests();
  }, []);

  const handleAction = async (conversionId, status) => {
    try {
      const response = await axios.patch('/api/aprove', { conversionId, status });

      if (response.data.success) {
        setPendingRequests(prev =>
          prev.filter(request => request._id !== conversionId)
        );
        alert(`Conversion request ${status} successfully.`);
      }
    } catch (error) {
      console.error(`Error ${status} conversion:`, error);
      alert(`Failed to ${status} conversion request.`);
    }
  };

  if (loading) return <p>Loading pending requests...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Pending Conversion Requests</h1>
      {pendingRequests.length === 0 ? (
        <p>No pending requests.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Request ID</th>
              <th>User ID</th>
              <th>Points Used</th>
              <th>Birr Equivalent</th>
              <th>Timestamp</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingRequests.map(request => (
              <tr key={request._id}>
                <td>{request._id}</td>
                <td>{request.userId}</td>
                <td>{request.pointsUsed.toLocaleString()}</td>
                <td>{request.birrEquivalent.toLocaleString()} birr</td>
                <td>{new Date(request.timestamp).toLocaleString()}</td>
                <td>
                  <button
                    className={`${styles.button} ${styles.approveButton}`}
                    onClick={() => handleAction(request._id, 'approved')}
                  >
                    Approve
                  </button>
                  <button
                    className={`${styles.button} ${styles.rejectButton}`}
                    onClick={() => handleAction(request._id, 'rejected')}
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

export default PendingPointPage;
