'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import styles from './UsersPage.module.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('/api/user');
        const sortedUsers = response.data.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setUsers(sortedUsers);
        setLoading(false);

        const userJoinDates = sortedUsers.reduce((acc, user) => {
          if (user.createdAt) {
            const date = new Date(user.createdAt).toLocaleDateString('en-US');
            acc[date] = (acc[date] || 0) + 1;
          }
          return acc;
        }, {});

        const labels = Object.keys(userJoinDates).sort((a, b) => new Date(a) - new Date(b));
        const data = labels.map(label => userJoinDates[label]);

        setChartData({
          labels,
          datasets: [
            {
              label: 'Users Joined per Day',
              data,
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.2,
            },
          ],
        });
      } catch (error) {
        setError('Error fetching users');
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleRequestInfo = async (userId, type) => {
    try {
      await axios.post('/api/bot/request', { userId, type });
      alert(`Requested ${type} from user ${userId}`);
    } catch (error) {
      console.error(`Error requesting ${type} from user ${userId}:`, error);
      alert(`Failed to request ${type}`);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Users</h1>
      <p className={styles.userCount}>Total Users: {users.length}</p>

      {/* Display the line chart if chartData is available */}
      {chartData && (
        <div className={styles.chartContainer}>
          <Line
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
                },
                title: {
                  display: true,
                  text: 'User Registrations Per Day',
                },
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text: 'Date',
                  },
                },
                y: {
                  title: {
                    display: true,
                    text: 'Number of Users',
                  },
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>
      )}

      <table className={styles.table}>
        <thead>
          <tr className={styles.tr}>
            <th className={styles.th}>Number</th>
            <th className={styles.th}>Time Joined</th>
            <th className={styles.th}>User ID</th>
            <th className={styles.th}>Phone Number</th>
            <th className={styles.th}>City</th>
            <th className={styles.th}>Commission</th>
            <th className={styles.th}>Points</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <tr key={user._id} className={styles.tr}>
              <td className={styles.td}>{index + 1}</td>
              <td className={styles.td}>
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })
                  : 'N/A'}
              </td>
              <td className={styles.td} onClick={() => router.push(`/admin/user/${user.userId}`)}>
                <a className={styles.link}>{user.userId}</a>
              </td>
              <td className={styles.td}>
                {user.phoneNumber && user.phoneNumber.length >= 12 ? (
                  user.phoneNumber
                ) : (
                  <button
                    onClick={() => handleRequestInfo(user.userId, 'phone number')}
                    className={`${styles.requestButton} ${styles.phoneButton}`}
                  >
                    Request Phone
                  </button>
                )}
              </td>
              <td className={styles.td}>
                {user.city ? (
                  user.city
                ) : (
                  <button
                    onClick={() => handleRequestInfo(user.userId, 'city')}
                    className={`${styles.requestButton} ${styles.cityButton}`}
                  >
                    Request City
                  </button>
                )}
              </td>
              <td className={styles.td}>{user.commission}</td>
              <td className={styles.td}>{new Intl.NumberFormat().format(user.points)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsersPage;
