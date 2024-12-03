'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import WebApp from '@twa-dev/sdk'; // Ensure correct import

const SellerPage = () => {
  const router = useRouter();
  const [userData, setUserData] = useState(null); // Fetch userData from WebApp
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubCategories] = useState([]);
  const [product, setProduct] = useState({
    name: '',
    description: '',
    price: '',
    commission: '',
    category: '',
    subcategory: '',
    stock: '',
    freeDelivery: false,
    onSale: false,
    userId: '', // Automatically filled
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch user information from WebApp SDK
  useEffect(() => {
    if (typeof window !== 'undefined' && WebApp.initDataUnsafe.user) {
      const user = WebApp.initDataUnsafe.user;
      setUserData(user);
      setProduct((prev) => ({
        ...prev,
        userId: user.id, // Automatically populate userId
        seller: user.username || user.first_name || 'Unknown Seller', // Auto-fill seller
      }));
    }
  }, []);

  // Fetch categories and subcategories
  useEffect(() => {
    const fetchCategoriesAndSubcategories = async () => {
      try {
        const [categoryRes, subcategoryRes] = await Promise.all([
          axios.get('/api/categories'),
          axios.get('/api/subcategories?all=true'),
        ]);
        setCategories(categoryRes.data.categories);
        setSubCategories(subcategoryRes.data.subcategories);
      } catch (err) {
        console.error('Error fetching categories and subcategories:', err);
      }
    };

    fetchCategoriesAndSubcategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct({
      ...product,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleImageUpload = (e) => {
    setImages(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    Object.entries(product).forEach(([key, value]) => formData.append(key, value));
    images.forEach((image) => formData.append('images', image));

    try {
      const response = await axios.post('/api/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: product.userId || '', // Include userId if available
        },
      });

      if (response.status === 201) {
        setSuccess('Product uploaded successfully! It is pending admin approval.');
        setProduct({
          name: '',
          description: '',
          price: '',
          commission: '',
          category: '',
          subcategory: '',
          stock: '',
          freeDelivery: false,
          onSale: false,
          userId: userData?.id || '',
        });
        setImages([]);

        setTimeout(() => {
          router.push('/uploaded');
        },);
      } else {
        setError('Failed to upload product.');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred while uploading the product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-6">Upload Product</h1>

      {error && <div className="bg-red-100 text-red-700 p-2 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-2 rounded mb-4">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        {/* Product Name */}
        <div className="flex flex-col">
          <label htmlFor="name" className="text-gray-700">Product Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={product.name}
            onChange={handleInputChange}
            required
            className="border border-gray-300 rounded p-2 mt-1"
          />
        </div>

        {/* Product Description */}
        <div className="flex flex-col">
          <label htmlFor="description" className="text-gray-700">Description</label>
          <textarea
            id="description"
            name="description"
            value={product.description}
            onChange={handleInputChange}
            required
            className="border border-gray-300 rounded p-2 mt-1"
          />
        </div>

        {/* Price and Commission */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="text-gray-700">Price</label>
            <input
              type="number"
              id="price"
              name="price"
              value={product.price}
              onChange={handleInputChange}
              className="border border-gray-300 rounded p-2 mt-1 w-full"
            />
          </div>
          <div>
            <label htmlFor="commission" className="text-gray-700">Commission</label>
            <input
              type="number"
              id="commission"
              name="commission"
              value={product.commission}
              onChange={handleInputChange}
              required
              className="border border-gray-300 rounded p-2 mt-1 w-full"
            />
          </div>
        </div>

        {/* Category and Subcategory */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="text-gray-700">Category</label>
            <select
              id="category"
              name="category"
              value={product.category}
              onChange={handleInputChange}
              required
              className="border border-gray-300 rounded p-2 mt-1 w-full"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="subcategory" className="text-gray-700">Subcategory</label>
            <select
              id="subcategory"
              name="subcategory"
              value={product.subcategory}
              onChange={handleInputChange}
              required
              className="border border-gray-300 rounded p-2 mt-1 w-full"
            >
              <option value="">Select a subcategory</option>
              {subcategories.map((sub) => (
                <option key={sub._id} value={sub.name}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stock */}
        <div className="flex flex-col">
          <label htmlFor="stock" className="text-gray-700">Stock</label>
          <input
            type="number"
            id="stock"
            name="stock"
            value={product.stock}
            onChange={handleInputChange}
            required
            className="border border-gray-300 rounded p-2 mt-1"
          />
        </div>

        {/* Free Delivery */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="freeDelivery"
            name="freeDelivery"
            checked={product.freeDelivery}
            onChange={handleInputChange}
            className="h-4 w-4"
          />
          <label htmlFor="freeDelivery" className="ml-2 text-gray-700">Free Delivery</label>
        </div>

        {/* On Sale */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="onSale"
            name="onSale"
            checked={product.onSale}
            onChange={handleInputChange}
            className="h-4 w-4"
          />
          <label htmlFor="onSale" className="ml-2 text-gray-700">On Sale</label>
        </div>

        {/* Images */}
        <div className="flex flex-col">
          <label htmlFor="images" className="text-gray-700">Images</label>
          <input
            type="file"
            id="images"
            name="images"
            multiple
            onChange={handleImageUpload}
            className="border border-gray-300 rounded p-2 mt-1"
          />
        </div>

        {/* User ID (Read-Only) */}
        <div className="flex flex-col">
          <label htmlFor="userId" className="text-gray-700">User ID</label>
          <input
            type="text"
            id="userId"
            name="userId"
            value={product.userId}
            readOnly
            className="border border-gray-300 rounded p-2 mt-1 bg-gray-100"
          />
        </div>

        {/* Seller (Read-Only) */}
        <div className="flex flex-col">
          <label htmlFor="seller" className="text-gray-700">Seller</label>
          <input
            type="text"
            id="seller"
            name="seller"
            value={product.seller}
            readOnly
            className="border border-gray-300 rounded p-2 mt-1 bg-gray-100"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? 'Uploading...' : 'Upload Product'}
        </button>
      </form>
    </div>
  );
};

export default SellerPage;
