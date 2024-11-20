// File path: /components/UserActionPage.js

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import styles from './UserActionPage.module.css';

const UserActionsPage = () => {
  const { userId } = useParams();
  const [actions, setActions] = useState([]);
  const [commission, setCommission] = useState(0);
  const [points, setPoints] = useState(0); // Store user.points from the database
  const [showConversionPopup, setShowConversionPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const POINTS_TO_BIRR_RATIO = 10000;
  const BIRR_CONVERSION_RATE = 5;

  useEffect(() => {
    if (!userId) return;

    const fetchUserData = async () => {
      try {
        const response = await axios.get(`/api/user/actions?userId=${userId}`);
        setActions(response.data.actions);
        setCommission(response.data.commission || 0);
        setPoints(response.data.points || 0); // Set points from database
        setLoading(false);
      } catch (error) {
        setError('Error fetching user data');
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  const handleCashout = () => {
    alert('Cashout initiated!');
  };

  const handleConvert = () => {
    setShowConversionPopup(true);
  };

  const handleChange = async () => {
    const pointsToConvert = Math.min(points); // Ensure we only convert available points
    const birrEquivalent = Math.floor(pointsToConvert / POINTS_TO_BIRR_RATIO) * BIRR_CONVERSION_RATE;

    if (birrEquivalent > 0) {
      try {
        const response = await axios.post('/api/user/convert', {
          userId,
          birrEquivalent,
          pointsUsed: Math.floor(pointsToConvert / POINTS_TO_BIRR_RATIO) * POINTS_TO_BIRR_RATIO,
        });

        if (response.data.success) {
          setCommission(commission + birrEquivalent);
          setPoints(points); // Reset points to zero
          setShowConversionPopup(false);
          alert(`Conversion successful! ${birrEquivalent} birr added to your commission.`);
        } else {
          alert('Conversion failed. Please try again.');
        }
      } catch (error) {
        console.error('Error converting points:', error);
        alert('Conversion failed. Please try again.');
      }
    } else {
      alert("You don't have enough points to convert.");
    }
  };

  const uniqueActions = [];
  const actionMap = new Map();

  actions.forEach(action => {
    if (!actionMap.has(action.action) || action.points) {
      actionMap.set(action.action, action);
    }
  });

  actionMap.forEach(action => uniqueActions.push(action));
  uniqueActions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const totalPointsInBirr = (points / POINTS_TO_BIRR_RATIO) * BIRR_CONVERSION_RATE;

  return (
    <div className={styles.container}>
      <div className={styles.commissionContainer}>
        <p><strong>Total Commission:</strong> {new Intl.NumberFormat().format(commission)} birr</p>
        <button className={styles.cashoutButton} onClick={handleCashout}>Cashout</button>
      </div>

      <div className={styles.totalPointsContainer}>
        <p><strong>Total Points:</strong> {new Intl.NumberFormat().format(points)}</p>
        <button 
          className={styles.convertButton} 
          onClick={handleConvert} 
          disabled={points === 0} // Disable button if points are zero
        >
          Convert
        </button>
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
          {uniqueActions.map((action, index) =>
            action.points && !isNaN(action.points) ? (
              <tr key={index} className={styles.tr}>
                <td className={styles.td}>{index + 1}</td>
                <td className={styles.td}>{action.joinerUserId}</td>
                <td className={styles.td}>{action.action}</td>
                <td className={styles.td}>{new Intl.NumberFormat().format(action.points)}</td>
              </tr>
            ) : null
          )}
        </tbody>
      </table>

      {showConversionPopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.popup}>
            <h3>Convert Points to Birr</h3>
            <p>Conversion Rate: 10,000 points = 5 birr</p>
            <p>Your Total Points: {new Intl.NumberFormat().format(points)}</p>
            <p>Birr Equivalent: {new Intl.NumberFormat().format(totalPointsInBirr)} birr</p>
            <button onClick={handleChange} className={styles.changeButton}>Convert</button>
            <button onClick={() => setShowConversionPopup(false)} className={styles.closeButton}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserActionsPage;
