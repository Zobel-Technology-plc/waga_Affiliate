'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const CanceledOrdersPage = () => {
  const [canceledOrders, setCanceledOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const itemsPerPage = 50; // Display 50 orders per page

  useEffect(() => {
    const fetchCanceledOrders = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/orders?canceled=true&page=${currentPage}&limit=${itemsPerPage}`);
        if (response.data.success) {
          setCanceledOrders(response.data.data);
          setTotalPages(Math.ceil(response.data.total / itemsPerPage));
        } else {
          setError(response.data.message || 'Failed to fetch canceled orders.');
        }
      } catch (err) {
        setError('An error occurred while fetching canceled orders.');
      } finally {
        setLoading(false);
      }
    };

    fetchCanceledOrders();
  }, [currentPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  if (loading) return <p className="text-center text-gray-600">Loading canceled orders...</p>;
  if (error) return <p className="text-center text-red-600">{error}</p>;

  return (
    <div className="container mx-auto p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-6">Canceled Orders</h1>
      {canceledOrders.length === 0 ? (
        <p className="text-center text-gray-600">No canceled orders found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded">
            <thead>
              <tr className="bg-gray-100 border-b">
                <th className="px-4 py-2 text-left">Order ID</th>
                <th className="px-4 py-2 text-left">User ID</th>
                <th className="px-4 py-2 text-left">Commission</th>
                <th className="px-4 py-2">Item</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Created At</th>
              </tr>
            </thead>
            <tbody>
              {canceledOrders.map((order) => (
                <tr key={order._id} className="border-b">
                  <td className="px-4 py-2">{order.orderId}</td>
                  <td className="px-4 py-2">{order.userId}</td>
                  <td className="px-4 py-2">{new Intl.NumberFormat().format(order.commissionamount)} birr</td>
                  <td>
                    <ul className="px-4 py-2 text-center">
                      {order.orderItems.map((item) => (
                        <li key={item._id} className="px-4 py-2">
                          {item.name} ({item.quantity} × {new Intl.NumberFormat().format(item.price)} birr)
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-2 text-red-500">{order.commissionStatus}</td>
                  <td className="px-4 py-2">{new Date(order.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          className={`px-4 py-2 bg-gray-200 rounded ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300'}`}
        >
          Previous
        </button>
        <span className="text-gray-700">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 bg-gray-200 rounded ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300'}`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default CanceledOrdersPage;
