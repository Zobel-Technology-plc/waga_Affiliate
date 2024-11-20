'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import styles from './UserActionsPage.module.css';

const UserActionsPage = () => {
  const { userId } = useParams();
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const fetchUserActions = async () => {
      try {
        const response = await axios.get(`/api/user/actions?userId=${userId}`);
        console.log('Fetched actions:', response.data.actions);
        setActions(response.data.actions);
        setLoading(false);
      } catch (error) {
        setError('Error fetching user actions');
        setLoading(false);
      }
    };

    fetchUserActions();
  }, [userId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  const uniqueActions = [];
  const actionMap = new Map();

  actions.forEach(action => {
    if (!actionMap.has(action.action) || action.points) {
      actionMap.set(action.action, action);
    }
  });

  actionMap.forEach(action => uniqueActions.push(action));

  // Sort actions by their time, newest first
  uniqueActions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const totalPoints = uniqueActions.reduce((sum, action) => sum + (action.points || 0), 0);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Actions for User {userId}</h1>
      <div className={styles.totalPoints}>
        <p><strong>Total Points:</strong> {new Intl.NumberFormat().format(totalPoints)}</p>
      </div>
      <table className={styles.table}>
        <thead>
          <tr className={styles.tr}>
            <th className={styles.th}>Number</th>
            <th className={styles.th}>User Id</th>
            <th className={styles.th}>Action</th>
            <th className={styles.th}>Points</th>
          </tr>
        </thead>
        <tbody>
          {uniqueActions
            .filter(action => !isNaN(action.points)) // Filter out actions with NaN points
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
};

export default UserActionsPage;
