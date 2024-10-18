'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const UserGraphPage = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Users Joined Per Day',
        data: [],
        borderColor: 'rgba(75,192,192,1)',
        backgroundColor: 'rgba(75,192,192,0.2)',
        fill: true,
      },
    ],
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data } = await axios.get('/api/user?last30days=true');
        const users = data.data;

        // Process data to get the number of users joined per day
        const userJoinDates = users.map(user => new Date(user.createdAt).toLocaleDateString());

        const userJoinCount = userJoinDates.reduce((acc, date) => {
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});

        const labels = Object.keys(userJoinCount);
        const counts = Object.values(userJoinCount);

        setChartData({
          labels,
          datasets: [
            {
              label: 'Users Joined Per Day',
              data: counts,
              borderColor: 'rgba(75,192,192,1)',
              backgroundColor: 'rgba(75,192,192,0.2)',
              fill: true,
            },
          ],
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  return (
    <div className="p-6 bg-white shadow-md rounded-lg max-w-4xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4">Users Joined Per Day (Last 30 Days)</h2>
      <Line data={chartData} />
    </div>
  );
};

export default UserGraphPage;
