'use client';
import { useState } from 'react';
import axios from 'axios';

const AdminCategory = () => {
  const [name, setName] = useState('');
  const [image, setImage] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!name || !image) {
      setErrorMessage('All fields are required');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('image', image);

    try {
      const { data } = await axios.post('/api/categories', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccessMessage(data.message);
      setName('');
      setImage(null);
      router.push('/admin/creation-success?type=category');
    } catch (error) {
      setErrorMessage(error.response.data.message || 'Error creating category');
    }
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-lg max-w-lg mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4">Create Category</h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700">Category Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Enter category name"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700">Image</label>
          <input
            type="file"
            onChange={(e) => setImage(e.target.files[0])}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>

        {errorMessage && <p className="text-red-500">{errorMessage}</p>}
        {successMessage && <p className="text-green-500">{successMessage}</p>}

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create Category
        </button>
      </form>
    </div>
  );
};

export default AdminCategory;
