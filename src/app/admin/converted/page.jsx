'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import styles from './converted.module.css';

const ConvertedPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await axios.get('/api/user/convert'); // Adjust the URL if needed
        if (response.data.success) {
          setRecords(response.data.data);
        } else {
          setError(response.data.message);
        }
      } catch (err) {
        setError('Failed to fetch conversion records');
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Conversion Records</h1>
      <table className={styles.table}>
        <thead>
          <tr className={styles.tr}>
            <th className={styles.th}>User ID</th>
            <th className={styles.th}>Points Used</th>
            <th className={styles.th}>Birr Equivalent</th>
            <th className={styles.th}>Converted At</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record._id} className={styles.tr}>
              <td className={styles.td} onClick={() => router.push(`/admin/user/${record.userId}`)}>
                <a className={styles.link}>{record.userId}</a>
              </td>
              <td className={styles.td}>{new Intl.NumberFormat().format(record.pointsUsed)}</td>
              <td className={styles.td}>{new Intl.NumberFormat().format(record.birrEquivalent)} birr</td>
              <td className={styles.td}>{new Date(record.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ConvertedPage;
