'use client';

import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend } from 'chart.js';

// Register chart components for ChartJS
ChartJS.register(LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend);

const AdminGraphPage = () => {
  const [totalOrderCount, setTotalOrderCount] = useState(0);
  const [totalServiceOrderCount, setTotalServiceOrderCount] = useState(0);
  const [dailyOrderCount, setDailyOrderCount] = useState(Array(31).fill(0));  // Array to store daily product order counts
  const [dailyServiceOrderCount, setDailyServiceOrderCount] = useState(Array(31).fill(0));  // Array to store daily service order counts

  // Fetch data when the component loads
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch product orders
        const productResponse = await fetch('/api/orders?last30Days=true');
        const productData = await productResponse.json();

        if (productResponse.ok) {
          // Set static total product orders count
          setTotalOrderCount(productData.orders.length);

          // Calculate daily counts for the last 30 days
          const dailyProductCounts = Array(31).fill(0);
          productData.orders.forEach(order => {
            const orderDate = new Date(order.createdAt).toLocaleDateString('en-US');
            const index = generateLastMonthDates().indexOf(orderDate);
            if (index !== -1) dailyProductCounts[index]++;
          });
          setDailyOrderCount(dailyProductCounts);  // Set dynamic daily product counts
        }

        // Fetch service orders
        const serviceResponse = await fetch('/api/services/serviceorder?last30Days=true');
        const serviceData = await serviceResponse.json();

        if (serviceResponse.ok) {
          // Set static total service orders count
          setTotalServiceOrderCount(serviceData.orders.length);

          // Calculate daily counts for the last 30 days
          const dailyServiceCounts = Array(31).fill(0);
          serviceData.orders.forEach(order => {
            const orderDate = new Date(order.createdAt).toLocaleDateString('en-US');
            const index = generateLastMonthDates().indexOf(orderDate);
            if (index !== -1) dailyServiceCounts[index]++;
          });
          setDailyServiceOrderCount(dailyServiceCounts);  // Set dynamic daily service counts
        }
      } catch (error) {
        console.error('Error fetching order data:', error);
      }
    };

    fetchData();
  }, []);

  // Function to generate last 31 days' dates for the chart labels
  const generateLastMonthDates = () => {
    const dates = [];
    const currentDate = new Date();
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(currentDate.getDate() - i);
      dates.push(date.toLocaleDateString('en-US'));
    }
    return dates;
  };

  // Chart data configuration
  const chartData = {
    labels: generateLastMonthDates(),  // X-axis labels (dates)
    datasets: [
      {
        label: 'Product Orders',
        data: dailyOrderCount,  // Y-axis data (product orders per day)
        borderColor: 'rgba(75, 192, 192, 0.8)',  // Line color for product orders
        backgroundColor: 'rgba(75, 192, 192, 0.1)',  // Fill color for product orders
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Service Orders',
        data: dailyServiceOrderCount,  // Y-axis data (service orders per day)
        borderColor: 'rgba(255, 159, 64, 0.8)',  // Line color for service orders
        backgroundColor: 'rgba(255, 159, 64, 0.1)',  // Fill color for service orders
        tension: 0.3,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
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
          text: 'Order Count',
        },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="p-8">
      {/* Line Chart */}
      <div className="bg-white p-8 rounded-lg shadow-md">
        <Line data={chartData} options={chartOptions} />  {/* Chart showing daily orders */}
      </div>
    </div>
  );
};

export default AdminGraphPage;
