/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './SellerProducts.module.css';
import { FaSpinner } from 'react-icons/fa';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const SellerProductsPage = () => {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [WebApp, setWebApp] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@twa-dev/sdk').then((WebAppModule) => {
        setWebApp(WebAppModule.default);
      });
    }
  }, []);

  useEffect(() => {
    const fetchSellerProducts = async () => {
      if (!WebApp) return;

      try {
        const userId = WebApp.initDataUnsafe?.user?.id;
        if (!userId) {
          throw new Error('Unable to retrieve user ID from Telegram WebApp.');
        }

        const response = await axios.get(`/api/products`, { params: { userId } });
        setProducts(response.data.products);
      } catch (err) {
        setError('Failed to fetch products.');
        console.error('Error fetching seller products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerProducts();
  }, [WebApp]);

  const handleEdit = (productId) => {
    setEditingProductId(productId);
  };

  const handleSave = async (productId) => {
    const product = products.find((p) => p._id === productId);
    if (!product) return;

    try {
      const response = await axios.put(`/api/products/${productId}`, {
        price: product.price,
        commission: product.commission,
      });

      if (response.status === 200) {
        setEditingProductId(null);
        alert('Product updated successfully!');
      }
    } catch (err) {
      console.error('Error updating product:', err);
      alert('Failed to update product.');
    }
  };

  const handleDelete = async (productId) => {
    try {
      const response = await axios.delete(`/api/products/${productId}`);
      if (response.status === 200) {
        setProducts((prev) => prev.filter((product) => product._id !== productId));
        alert('Product deleted successfully!');
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product.');
    }
  };

  const handleInputChange = (productId, field, value) => {
    setProducts((prev) =>
      prev.map((product) =>
        product._id === productId ? { ...product, [field]: value } : product
      )
    );
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <FaSpinner className="animate-spin" size={24} />
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
    <div className="mb-4 cursor-pointer" onClick={() => router.push('/profile')}>
        <Image
          src="/assets/icons/back.png"  // Path to the back button image
          alt="Back to Services"
          width={30}  // Set desired width
          height={30}  // Set desired height
          className="hover:opacity-80"  // Optional hover effect
        />
      </div> 

      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div className={styles.productList}>
          {products.map((product) => (
            <div key={product._id} className={styles.productCard}>
              <img
                src={product.images?.[0]?.url || '/fallback.png'}
                alt={product.name}
                className={styles.productImage}
              />
              <h3 className={styles.productName}>{product.name}</h3>
              <p className={styles.productPrice}>
                {`Price: `}
                {editingProductId === product._id ? (
                  <input
                    type="number"
                    value={product.price}
                    onChange={(e) => handleInputChange(product._id, 'price', e.target.value)}
                    className={styles.input}
                  />
                ) : (
                  `$${product.price}`
                )}
              </p>
              <p className={styles.productCommission}>
                {`Commission: `}
                {editingProductId === product._id ? (
                  <input
                    type="number"
                    value={product.commission}
                    onChange={(e) =>
                      handleInputChange(product._id, 'commission', e.target.value)
                    }
                    className={styles.input}
                  />
                ) : (
                  `${product.commission}`
                )}
              </p>
              <p className={styles.productStock}>{`Stock: ${product.stock}`}</p>
              <p className={styles.productStatus}>{`Status: ${product.status}`}</p>
              <div className={styles.actionButtons}>
                {editingProductId === product._id ? (
                  <button
                    className={styles.saveButton}
                    onClick={() => handleSave(product._id)}
                  >
                    Save
                  </button>
                ) : (
                  <button
                    className={styles.editButton}
                    onClick={() => handleEdit(product._id)}
                  >
                    Edit
                  </button>
                )}
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDelete(product._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerProductsPage;
