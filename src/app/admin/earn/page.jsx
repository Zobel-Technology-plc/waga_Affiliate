/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import styles from './EarnPage.module.css';

const EarnPage = () => {
  const [earnOptions, setEarnOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Fetch earn options on page load
  useEffect(() => {
    const fetchEarnOptions = async () => {
      try {
        const response = await axios.get('/api/earnOptions');
        if (response.data.success) {
          setEarnOptions(response.data.data);
        } else {
          setError(response.data.message);
        }
      } catch (err) {
        setError('Failed to fetch earn options');
      } finally {
        setLoading(false);
      }
    };

    fetchEarnOptions();
  }, []);

  // Handle card click to navigate to the dynamic action details page
  const handleCardClick = (actionName) => {
    const encodedActionName = encodeURIComponent(actionName);
    router.push(`/admin/earn/${encodedActionName}`); // Navigate to dynamic route
  };

  if (loading) return <p>Loading earn options...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Earn Options</h1>
      <div className={styles.cardContainer}>
        {earnOptions.map((option) => (
          <div
            key={option._id}
            className={styles.card}
            onClick={() => handleCardClick(option.text)}
          >
            <img src={option.icon} alt={option.text} className={styles.cardImage} />
            <h3 className={styles.cardTitle}>{option.text}</h3>
            <p className={styles.cardPoints}>+{new Intl.NumberFormat().format(option.points)} points</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EarnPage;
