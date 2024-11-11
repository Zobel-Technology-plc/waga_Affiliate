'use client';

import { useEffect, useState, useCallback } from 'react';
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
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [message, setMessage] = useState('');
  const [image, setImage] = useState(null);
  const [sending, setSending] = useState(false);
  const [broadcastResults, setBroadcastResults] = useState(null); // Track broadcast results
  const [lastRetryTime, setLastRetryTime] = useState(null); // Track last retry time

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

  // Define retryFailedMessages as a stable function using useCallback
  const retryFailedMessages = useCallback(async () => {
    const failedUserIds = broadcastResults ? broadcastResults.failed : [];

    if (!failedUserIds || failedUserIds.length === 0) {
      console.log("No failed user IDs to retry");
      return;
    }

    console.log("Retrying failed messages for user IDs:", failedUserIds);

    const formData = new FormData();
    formData.append("message", message);
    if (image) formData.append("image", image);
    formData.append("userIds", JSON.stringify(failedUserIds));

    setSending(true);
    try {
      const response = await axios.post("/api/bot/retryFailedMessages", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setBroadcastResults(response.data.results);
      alert("Retry broadcast sent to users with failed status.");
    } catch (error) {
      console.error("Error retrying failed messages:", error);
      alert("Failed to retry message.");
    } finally {
      setSending(false);
    }
  }, [broadcastResults, message, image]); // Include dependencies

  const handleSendMessage = async () => {
    if (!message && !image) {
      alert('Please enter a message or select an image.');
      return;
    }

    const formData = new FormData();
    formData.append('message', message);
    if (image) formData.append('image', image);

    setSending(true);
    try {
      const response = await axios.post('/api/bot/broadcastMessage', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setBroadcastResults(response.data.results); // Store broadcast results
      alert('Message sent to all users.');
      setMessage('');
      setImage(null);
      setShowMessageForm(false);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  // Automatically retry failed messages after 2 hours
  useEffect(() => {
    if (broadcastResults && broadcastResults.failed.length > 0) {
      const retryTimeout = setTimeout(() => {
        retryFailedMessages();
        setLastRetryTime(new Date());
      }, 2 * 60 * 60 * 1000); // 2 hours in milliseconds

      return () => clearTimeout(retryTimeout);
    }
  }, [broadcastResults, retryFailedMessages]); // Add retryFailedMessages to dependencies

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Users</h1>
        <button onClick={() => setShowMessageForm(!showMessageForm)} className={styles.sendMessageButton}>
          {showMessageForm ? 'Hide Message Form' : 'Send Message'}
        </button>
      </div>
      <p className={styles.userCount}>Total Users: {users.length}</p>

      {showMessageForm && (
        <div className={styles.messageForm}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message here"
            className={styles.messageInput}
          />

          {broadcastResults && (
            <div className={styles.broadcastResults}>
              <h3 className='mt-7'>Broadcast Results</h3>
              <p>Success: {broadcastResults.success.length}</p>
              <p>Failed: {broadcastResults.failed.length}</p>
            </div>
          )}

          <button onClick={handleSendMessage} disabled={sending} className={styles.sendButton}>
            {sending ? 'Sending...' : 'Send'}
          </button>

          {/* Show retry button if there are failed messages */}
          {broadcastResults && broadcastResults.failed.length > 0 && (
            <button 
              onClick={retryFailedMessages} 
              disabled={sending} 
              className={`${
                sending 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
              } text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out`}
            >
              {sending ? "Retrying..." : "Retry Failed Messages"}
            </button>
          )}
        </div>
      )}

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
              <td className={styles.td}>{user.phoneNumber}</td>
              <td className={styles.td}>{user.city}</td>
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
