'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import AdminGraphPage from './graph/page';
import Link from 'next/link';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Function to generate an array of dates from one month ago to today
const generateLastMonthDates = () => {
  const today = new Date();
  const dates = [];
  const currentDate = new Date(today);
  currentDate.setDate(currentDate.getDate() - 30); // Start from 30 days ago

  while (currentDate <= today) {
    dates.push(new Date(currentDate).toLocaleDateString()); // Format the date as string
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

const AdminDashboard = () => {
  const { data: session, status } = useSession();
  const [activeTab,] = useState('dashboard');
  const router = useRouter();
  const [userCount, setUserCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [PendingorderCount, setPendingOrderCount] = useState(0);
  const [serviceOrderCount, setServiceOrderCount] = useState(0);
  const [pendigserviceOrderCount, setPendingServiceOrderCount] = useState(0);
  const [pendingCommissionTotal, setPendingCommissionTotal] = useState(0); // Total commission state
  const [totalServiceCommission, setTotalServiceCommission] = useState(0); // Total service commission state
  
  // Arrays to store historical data for chart
  const [historyData, setHistoryData] = useState({
    labels: generateLastMonthDates(), // Generate the dates for the last month
    users: Array(31).fill(0), // Initialize with empty data for each day
    productOrders: Array(31).fill(0),
    serviceOrders: Array(31).fill(0),
    pendingCommissions: Array(31).fill(0),
    serviceCommissions: Array(31).fill(0), // To track service commission history data
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchData = async () => {
      const fetchUserCount = async () => {
        try {
          const response = await fetch('/api/user');
          const data = await response.json();
          if (response.ok) {
            setUserCount(data.data.length);
            return data.data.length;
          }
        } catch (error) {
          console.error('Error fetching user count:', error);
          return 0;
        }
      };

      const fetchOrderCount = async () => {
        try {
          const response = await fetch('/api/orders?all=true', { cache: 'no-store' });
          const data = await response.json();
          if (response.ok && data.success) {
            setOrderCount(data.count);
            return data.count;
          }
        } catch (error) {
          console.error('Error fetching product order count:', error);
          return 0;
        }
      };

      const fetchPredningOrderCount = async () => {
        try {
          const response = await fetch('/api/orders?pending=true', { cache: 'no-store' });
          const data = await response.json();
          if (response.ok && data.success) {
            setPendingOrderCount(data.count);
            return data.count;
          }
        } catch (error) {
          console.error('Error fetching product order count:', error);
          return 0;
        }
      };

      const fetchPendingServiceOrderCount = async () => {
        try {
          const response = await fetch('/api/services/serviceorder?pending=true');
          const data = await response.json();
          if (response.ok) {
            setPendingServiceOrderCount(data.data.length);
            return data.data.length;
          }
        } catch (error) {
          console.error('Error fetching service order count:', error);
          return 0;
        }
      };

      const fetchServiceOrderCount = async () => {
        try {
          const response = await fetch('/api/services/serviceorder?all=true');
          const data = await response.json();
          if (response.ok) {
            setServiceOrderCount(data.data.length);
            return data.data.length;
          }
        } catch (error) {
          console.error('Error fetching service order count:', error);
          return 0;
        }
      };

      const fetchTotalCommission = async () => {
        try {
          const response = await fetch('/api/user?hasCommission=true');
          const data = await response.json();

          if (response.ok && data.success) {
            setPendingCommissionTotal(data.totalCommission || 0); // Set total commission in state
            return data.totalCommission || 0;
          } else {
            console.error('Failed to fetch commission data:', data.message);
            return 0;
          }
        } catch (error) {
          console.error('Error fetching total commission:', error);
          return 0;
        }
      };

      const fetchTotalServiceCommission = async () => {
        try {
          const response = await fetch('/api/services/serviceorder?commissionAmount=true'); // Adjust your endpoint accordingly
          const data = await response.json();
          if (response.ok && data.success) {
            const totalCommissionAmount = data.orders.reduce(
              (acc, order) => acc + (order.commissionAmount || 0),
              0
            );
            setTotalServiceCommission(totalCommissionAmount); // Update state with total service commission amount
            return totalCommissionAmount;
          }
        } catch (error) {
          console.error('Error fetching total service commission:', error);
          return 0;
        }
      };

      const [
        users,
        productOrders,
        pendingProductOrders,
        pendingServiceOrders,
        serviceOrders,
        totalCommission,
        serviceCommission
      ] = await Promise.all([
        fetchUserCount(),
        fetchOrderCount(),
        fetchPredningOrderCount(),
        fetchPendingServiceOrderCount(),
        fetchServiceOrderCount(),
        fetchTotalCommission(),
        fetchTotalServiceCommission()
      ]);

      setHistoryData(prevState => {
        const newState = { ...prevState };
        newState.users[newState.users.length - 1] = users;
        newState.productOrders[newState.productOrders.length - 1] = productOrders;
        newState.serviceOrders[newState.serviceOrders.length - 1] = serviceOrders;
        newState.pendingCommissions[newState.pendingCommissions.length - 1] = totalCommission;
        newState.serviceCommissions[newState.serviceCommissions.length - 1] = serviceCommission;
        return newState;
      });
    };

    fetchData();
  }, []);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  const chartData = {
    labels: historyData.labels,
    datasets: [
      {
        label: 'Users',
        data: historyData.users,
        borderColor: 'blue',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        fill: true,
      },
      {
        label: 'Product Orders',
        data: historyData.productOrders,
        borderColor: 'green',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        fill: true,
      },
      {
        label: 'Service Orders',
        data: historyData.serviceOrders,
        borderColor: 'orange',
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
        fill: true,
      },
      {
        label: 'Pending Commissions',
        data: historyData.pendingCommissions,
        borderColor: 'purple',
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        fill: true,
      },
      {
        label: 'Service Commissions',
        data: historyData.serviceCommissions,
        borderColor: 'red',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        fill: true,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
    },
    scales: {
      x: { display: true },
      y: { display: true, beginAtZero: true },
    },
  };

  return session && (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1">
        {activeTab === 'dashboard' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-12 rounded-lg shadow-md text-center text-xl relative h-48 flex flex-col justify-end transition-transform duration-300 transform hover:scale-105">
                <Link href="admin/user">
                    <div className="absolute top-4 left-40 w-16 h-16 bg-blue-500 rounded-full"></div>
                    <div>Total Users: {userCount}</div>
                </Link>
              </div>
              <div className="bg-white p-12 rounded-lg shadow-md text-center text-xl relative h-48 flex flex-col justify-end transition-transform duration-300 transform hover:scale-105">
                <Link href="/admin/orderlist">
                    <div className="absolute top-4 left-40 w-16 h-16 bg-green-500 rounded-full"></div>
                    <div>Total Product Orders: {PendingorderCount}</div>
                </Link>
              </div>
              <div className="bg-white p-12 rounded-lg shadow-md text-center text-xl relative h-48 flex flex-col justify-end transition-transform duration-300 transform hover:scale-105">
                <Link href="/admin/serviceorderlist">
                    <div className="absolute top-4 left-40 w-16 h-16 bg-yellow-500 rounded-full"></div>
                    <div>Total Service Orders: {pendigserviceOrderCount}</div>
                </Link>
              </div>
              <div className="bg-white p-12 rounded-lg shadow-md text-center text-xl relative h-48 flex flex-col justify-end transition-transform duration-300 transform hover:scale-105">
                <Link href="#">
                  <div className="absolute top-4 left-40 w-16 h-16 bg-purple-500 rounded-full"></div>
                  <div>Commissions: {new Intl.NumberFormat().format(pendingCommissionTotal)}</div>
                </Link>
              </div>
            </div>
            <AdminGraphPage/>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
