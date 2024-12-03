/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { useRouter } from 'next/navigation';
import './Profile.css'; // Import the CSS file

const Profile = () => {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [points, setPoints] = useState(0);
  const [commission, setCommission] = useState(0); // State for commission
  const [phoneNumber, setPhoneNumber] = useState(''); // State for phone number
  const [city, setCity] = useState(''); // State for city
  const [role, setRole] = useState(''); // State for user role

  useEffect(() => {
    // Fetch the user data from Telegram WebApp SDK
    if (typeof window !== 'undefined' && WebApp.initDataUnsafe.user) {
      setUserData(WebApp.initDataUnsafe.user);
    }
  }, []);

  useEffect(() => {
    if (userData) {
      // Fetch the user's profile information including points, commission, phone number, city, and role
      const fetchUserProfile = async () => {
        try {
          const response = await fetch(`/api/user/${userData.id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch user profile');
          }
          const data = await response.json();
          setPoints(data.data.points || 0);
          setCommission(data.data.commission || 0);
          setPhoneNumber(data.data.phoneNumber || '');
          setCity(data.data.City || ''); // Set the fetched city
          setRole(data.data.Role || ''); // Set the fetched role
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      };

      fetchUserProfile();
    }
  }, [userData]);

  const handleWithdrawClick = () => {
    if (userData) {
      router.push(`/profile/${userData.id}`);
    }
  };

  const handleUploadProductsClick = () => {
    if (userData) {
      router.push(`/seller`);
    }
  };

  if (!userData) {
    return <p>Loading profile...</p>;
  }

  return (
    <div className="container">
      <h1 className="profile-title">Profile</h1>
      <div className="profile-card mb-10">
        <div className="profile-header">
          <img
            src={userData.photo_url || '/images/default_avatar.png'}
            alt="Profile Picture"
            className="profile-picture"
          />
          <div>
            <h2 className="profile-name">{userData.first_name} {userData.last_name}</h2>
            <p className="profile-username">@{userData.username}</p>
          </div>
        </div>

        <div className="profile-info">
          <h3 className="profile-info-title">Account Information</h3>
          <ul className="profile-info-list">
            <li><strong>ID:</strong> {userData.id}</li>
            <li><strong>First Name:</strong> {userData.first_name}</li>
            {userData.last_name && <li><strong>Last Name:</strong> {userData.last_name}</li>}
            <li><strong>Username:</strong> @{userData.username}</li>
            <li><strong>Phone Number:</strong> {phoneNumber}</li>
            <li><strong>City:</strong> {city}</li>
            <li><strong>Total Points:</strong> {new Intl.NumberFormat().format(points)}</li>
            <li><strong>Total Commission:</strong> {new Intl.NumberFormat().format(commission.toFixed(2))} birr</li>
          </ul>
        </div>

        <button className="withdraw-button" onClick={handleWithdrawClick}>
          Withdraw
        </button>

        {/* Display the Upload Products button if the user is a seller */}
        {role === 'seller' && (
          <button className="upload-button" onClick={handleUploadProductsClick}>
            Upload Products
          </button>
        )}
      </div>
    </div>
  );
};

export default Profile;
