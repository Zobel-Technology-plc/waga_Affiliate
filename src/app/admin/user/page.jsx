// app/users/page.jsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';  // Correct import for Next.js App Router
import axios from 'axios';
import styles from './UsersPage.module.css';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize the router
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('/api/user');
        setUsers(response.data.data);
        setLoading(false);
      } catch (error) {
        setError('Error fetching users');
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Users</h1>
      <p className={styles.userCount}>Total Users: {users.length}</p>
      <table className={styles.table}>
        <thead>
          <tr className={styles.tr}>
            <th className={styles.th}>Number</th>
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
              {/* Use router.push to navigate to dynamic route */}
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
