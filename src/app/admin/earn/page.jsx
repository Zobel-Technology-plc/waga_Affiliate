/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import styles from './EarnPage.module.css';
import { FaPlus, FaTimes } from 'react-icons/fa';

const EarnPage = () => {
  const [earnOptions, setEarnOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isStoryEarn, setIsStoryEarn] = useState(false);
  const [formData, setFormData] = useState({
    text: '',
    points: '',
    icon: null,
    image: null,
    description: '',
    link: '',
    requiresCheck: false,
  });
  const router = useRouter();

  // Fetch earn options on page load
  useEffect(() => {
    const fetchEarnOptions = async () => {
      try {
        const response = await axios.get('/api/earnOptions');
        if (response.data.success) {
          setEarnOptions(response.data.data);
        } else {
          setError(response.data.message);
        }
      } catch (err) {
        setError('Failed to fetch earn options');
      } finally {
        setLoading(false);
      }
    };

    fetchEarnOptions();
  }, []);

  // Handle card click to navigate to the dynamic action details page
  const handleCardClick = (actionName) => {
    const encodedActionName = encodeURIComponent(actionName);
    router.push(`/admin/earn/${encodedActionName}`); // Navigate to dynamic route
  };

  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // Handle icon file selection
  const handleIconChange = (e) => {
    setFormData({
      ...formData,
      icon: e.target.files[0],
    });
  };

  // Handle image file selection for Story Earn
  const handleImageChange = (e) => {
    setFormData({
      ...formData,
      image: e.target.files[0],
    });
  };

  // Toggle form visibility and type selection
  const handleNewEarnClick = () => {
    setIsFormVisible(true);
  };

  const handleEarnTypeChange = (e) => {
    setIsStoryEarn(e.target.value === 'story');
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();
    formDataToSend.append('text', formData.text);
    formDataToSend.append('points', formData.points);
    formDataToSend.append('icon', formData.icon);
    formDataToSend.append('link', formData.link);
    formDataToSend.append('requiresCheck', formData.requiresCheck);
    
    if (isStoryEarn) {
      formDataToSend.append('image', formData.image);
      formDataToSend.append('description', formData.description);
    }

    try {
      const response = await axios.post('/api/earnOptions', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setEarnOptions([...earnOptions, response.data.data]);
        setIsFormVisible(false); // Close form
        setFormData({
          text: '',
          points: '',
          icon: null,
          image: null,
          description: '',
          link: '',
          requiresCheck: false,
        });
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError('Failed to create earn option');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation(); // Prevent card click event
    
    if (window.confirm('Are you sure you want to delete this earn option?')) {
      try {
        const response = await axios.delete(`/api/earnOptions/delete?id=${id}`);

        if (response.data.success) {
          // Remove the deleted option from state
          setEarnOptions(earnOptions.filter(option => option._id !== id));
        } else {
          setError(response.data.message);
        }
      } catch (err) {
        setError('Failed to delete earn option');
      }
    }
  };

  if (loading) return <p>Loading earn options...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Earn Options</h1>
      <button className={styles.newEarnButton} onClick={handleNewEarnClick}>
        New Earn
      </button>

      {isFormVisible && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.earnTypeSelection}>
            <label>
              <input
                type="radio"
                name="earnType"
                value="story"
                checked={isStoryEarn}
                onChange={handleEarnTypeChange}
              />
              Story Earn
            </label>
            <label>
              <input
                type="radio"
                name="earnType"
                value="other"
                checked={!isStoryEarn}
                onChange={handleEarnTypeChange}
              />
              Other
            </label>
          </div>

          <input
            type="text"
            name="text"
            value={formData.text}
            onChange={handleInputChange}
            placeholder="Earn text"
            required
            className={styles.input}
          />
          <input
            type="number"
            name="points"
            value={formData.points}
            onChange={handleInputChange}
            placeholder="Points"
            required
            className={styles.input}
          />
          <div className={styles.fileInput}>
            <label>Icon (PNG only)</label>
            <input
              type="file"
              name="icon"
              onChange={handleIconChange}
              accept="image/png"
              required
              className={styles.input}
            />
          </div>
          {isStoryEarn && (
            <>
              <div className={styles.fileInput}>
                <label>Story Image</label>
                <input
                  type="file"
                  name="image"
                  onChange={handleImageChange}
                  accept="image/jpeg, image/png"
                  required
                  className={styles.input}
                />
              </div>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Description"
                required
                className={styles.textarea}
              />
            </>
          )}
          <input
            type="text"
            name="link"
            value={formData.link}
            onChange={handleInputChange}
            placeholder="Link (optional)"
            className={styles.input}
          />
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              name="requiresCheck"
              checked={formData.requiresCheck}
              onChange={handleInputChange}
              className={styles.checkbox}
            />
            Requires Check
          </label>
          <button type="submit" className={styles.submitButton}>
            Create Earn Option
          </button>
        </form>
      )}

      <div className={styles.cardContainer}>
        {earnOptions.map((option) => (
          <div
            key={option._id}
            className={styles.card}
            onClick={() => handleCardClick(option.text)}
          >
            <div className={styles.deleteButton}>
              <button
                onClick={(e) => handleDelete(option._id, e)}
                className={styles.iconButton}
              >
                <FaTimes />
              </button>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.imageWrapper}>
                <Image
                  src={option.icon || '/default-icon.png'}
                  alt={option.text}
                  width={60}
                  height={60}
                  className={styles.icon}
                  unoptimized={true}
                  onError={(e) => {
                    e.target.src = '/default-icon.png';
                  }}
                />
              </div>
              <h3>{option.text}</h3>
              <p className={styles.points}>+{new Intl.NumberFormat().format(option.points)} points</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EarnPage;
