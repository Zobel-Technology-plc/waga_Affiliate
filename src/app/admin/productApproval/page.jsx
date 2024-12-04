'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ProductApprovalPage = () => {
  const [pendingProducts, setPendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPendingProducts = async () => {
      try {
        const response = await axios.get('/api/products/approval');
        if (response.data.success) {
          setPendingProducts(response.data.products);
        } else {
          setError('Failed to fetch pending products.');
        }
      } catch (err) {
        setError('An error occurred while fetching pending products.');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingProducts();
  }, []);

  const handleApprove = async (productId, seller) => {
    try {
      await axios.post(`/api/products/approval/approve`, { productId, seller });
      setPendingProducts((prev) => prev.filter((product) => product._id !== productId));
    } catch (err) {
      setError('Failed to approve the product.');
    }
  };
  

  const handleReject = async (productId, seller) => {
    try {
      await axios.post(`/api/products/approval/reject`, { productId, seller });
      setPendingProducts((prev) => prev.filter((product) => product._id !== productId));
    } catch (err) {
      setError('Failed to reject the product.');
    }
  };
  
  if (loading) return <p>Loading pending products...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="container mx-auto p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-6">Pending Product Approvals</h1>
      {pendingProducts.length === 0 ? (
        <p>No pending products for approval.</p>
      ) : (
        <table className="min-w-full bg-white border border-gray-200 rounded">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2">Product Name</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Seller</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingProducts.map((product) => (
              <tr key={product._id} className="border-b">
                <td className="px-4 py-2">{product.name}</td>
                <td className="px-4 py-2">{product.category}</td>
                <td className="px-4 py-2">{product.seller}</td>
                <td className="px-4 py-2 flex space-x-2">
                  <button
                    onClick={() => handleApprove(product._id, product.seller)}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(product._id , product.seller)}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default ProductApprovalPage;
