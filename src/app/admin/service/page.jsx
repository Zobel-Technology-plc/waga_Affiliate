/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ServicePage = () => {
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    startingPrice: '',
    commission: '',
    point: '',
    image: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null); // Track service being edited

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get('/api/services');
        if (response.data.success) {
          setServices(response.data.data);
        } else {
          setError('Failed to fetch services.');
        }
      } catch (err) {
        setError('An error occurred while fetching services.');
      }
    };

    fetchServices();
  }, []);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleImageChange = (e) => {
    setFormData((prev) => ({ ...prev, image: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.name || !formData.startingPrice || !formData.commission || !formData.point || !formData.image) {
      setError('All fields are required.');
      setLoading(false);
      return;
    }

    const serviceData = new FormData();
    Object.keys(formData).forEach((key) => {
      serviceData.append(key, formData[key]);
    });

    try {
      const response = await axios.post('/api/services', serviceData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setServices((prev) => [response.data.data, ...prev]);
        setSuccess('Service created successfully.');
        setFormData({
          name: '',
          startingPrice: '',
          commission: '',
          point: '',
          image: null,
        });
        setShowForm(false);
      } else {
        setError(response.data.message || 'Failed to create service.');
      }
    } catch (err) {
      setError('An error occurred while creating the service.');
    } finally {
      setLoading(false);
    }
  };

  const handleInlineEdit = (serviceId) => {
    setEditingServiceId(serviceId);
  };

  const handleSaveEdit = async (serviceId) => {
    const serviceToUpdate = services.find((s) => s._id === serviceId);

    try {
      const response = await axios.put(`/api/service/${serviceId}`, {
        name: serviceToUpdate.name,
        startingPrice: serviceToUpdate.startingPrice,
        commission: serviceToUpdate.commission,
        point: serviceToUpdate.point,
      });

      if (response.data.success) {
        setServices((prev) =>
          prev.map((service) => (service._id === serviceId ? response.data.data : service))
        );
        setSuccess('Service updated successfully.');
      } else {
        setError(response.data.message || 'Failed to update service.');
      }
    } catch (err) {
      setError('An error occurred while updating the service.');
    } finally {
      setEditingServiceId(null);
    }
  };

  const handleDelete = async (serviceId) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const response = await axios.delete(`/api/service/${serviceId}`);
      if (response.data.success) {
        setServices((prev) => prev.filter((service) => service._id !== serviceId));
        setSuccess('Service deleted successfully.');
      } else {
        setError(response.data.message || 'Failed to delete service.');
      }
    } catch (err) {
      setError('An error occurred while deleting the service.');
    }
  };

  return (
    <div className="container mx-auto p-6 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-6">Services</h1>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4">{success}</div>}

      <button
        onClick={() => setShowForm((prev) => !prev)}
        className="mb-4 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
      >
        {showForm ? 'Hide Form' : 'New Service'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-gray-700">Service Name</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 p-2 rounded"
            />
          </div>

          <div>
            <label htmlFor="startingPrice" className="block text-gray-700">Starting Price (birr)</label>
            <input
              type="number"
              id="startingPrice"
              value={formData.startingPrice}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 p-2 rounded"
            />
          </div>

          <div>
            <label htmlFor="commission" className="block text-gray-700">Commission</label>
            <input
              type="number"
              id="commission"
              value={formData.commission}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 p-2 rounded"
            />
          </div>

          <div>
            <label htmlFor="point" className="block text-gray-700">Point</label>
            <input
              type="number"
              id="point"
              value={formData.point}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 p-2 rounded"
            />
          </div>

          <div>
            <label htmlFor="image" className="block text-gray-700">Service Image</label>
            <input
              type="file"
              id="image"
              onChange={handleImageChange}
              required
              className="w-full border border-gray-300 p-2 rounded"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Service'}
          </button>
        </form>
      )}

      <h2 className="text-xl font-semibold mt-8 mb-4">Available Services</h2>
      <table className="min-w-full bg-white shadow rounded overflow-hidden">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="px-4 py-2">Service Image</th>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Starting Price</th>
            <th className="px-4 py-2">Commission</th>
            <th className="px-4 py-2">Point</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {services.map((service) => (
            <tr key={service._id} className="border-b">
              <td className="px-4 py-2">
                <img src={service.image} alt={service.name} className="w-16 h-16 object-cover rounded" />
              </td>
              <td className="px-4 py-2">
                {editingServiceId === service._id ? (
                  <input
                    type="text"
                    value={service.name}
                    onChange={(e) =>
                      setServices((prev) =>
                        prev.map((s) =>
                          s._id === service._id ? { ...s, name: e.target.value } : s
                        )
                      )
                    }
                    className="border border-gray-300 p-1 rounded"
                  />
                ) : (
                  service.name
                )}
              </td>
              <td className="px-4 py-2">
                {editingServiceId === service._id ? (
                  <input
                    type="number"
                    value={service.startingPrice}
                    onChange={(e) =>
                      setServices((prev) =>
                        prev.map((s) =>
                          s._id === service._id ? { ...s, startingPrice: e.target.value } : s
                        )
                      )
                    }
                    className="border border-gray-300 p-1 rounded"
                  />
                ) : (
                  `${service.startingPrice} birr`
                )}
              </td>
              <td className="px-4 py-2">
                {editingServiceId === service._id ? (
                  <input
                    type="number"
                    value={service.commission}
                    onChange={(e) =>
                      setServices((prev) =>
                        prev.map((s) =>
                          s._id === service._id ? { ...s, startingPrice: e.target.value } : s
                        )
                      )
                    }
                    className="border border-gray-300 p-1 rounded"
                  />
                ) : (
                  `${service.commission} birr`
                )}
              </td>
              <td className="px-4 py-2">
                {editingServiceId === service._id ? (
                  <input
                    type="number"
                    value={service.point}
                    onChange={(e) =>
                      setServices((prev) =>
                        prev.map((s) =>
                          s._id === service._id ? { ...s, startingPrice: e.target.value } : s
                        )
                      )
                    }
                    className="border border-gray-300 p-1 rounded"
                  />
                ) : (
                  `${service.point} `
                )}
              </td>
              <td className="px-4 py-2 flex space-x-2 mt-3">
                {editingServiceId === service._id ? (
                  <button
                    onClick={() => handleSaveEdit(service._id)}
                    className="bg-green-500 text-white px-4 py-1 rounded"
                  >
                    Save
                  </button>
                ) : (
                  <button
                    onClick={() => handleInlineEdit(service._id)}
                    className="bg-yellow-500 text-white px-4 py-1 rounded"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => handleDelete(service._id)}
                  className="bg-red-600 text-white px-4 py-1 rounded"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ServicePage;
