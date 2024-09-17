/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import './Profile.css'; // Import the CSS file

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [points, setPoints] = useState(0);
  const [commission, setCommission] = useState(0); // State for commission
  const [phoneNumber, setPhoneNumber] = useState(''); // State for phone number
  const [City, setCity]= useState('')

  useEffect(() => {
    // Fetch the user data from Telegram WebApp SDK
    if (typeof window !== 'undefined' && WebApp.initDataUnsafe.user) {
      setUserData(WebApp.initDataUnsafe.user);
    }
  }, []);

  useEffect(() => {
    if (userData) {
      // Fetch the user's profile information including points, commission, and phone number
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
          setCity(data.data.City|| '')// Set the fetched phone number
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      };

      fetchUserProfile();
    }
  }, [userData]);

  if (!userData) {
    return <p>Loading profile...</p>;
  }

  return (
    <div className="container">
      <h1 className="profile-title">Profile</h1>
      <div className="profile-card mb-9">
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
            <li><strong>Phone Number:</strong> {phoneNumber}</li> {/* Display phone number */}
            <li><strong>City:</strong> {City}</li>
            <li><strong>Total Points:</strong> {points}</li> {/* Display total points */}
            <li><strong>Total Commission:</strong> {commission.toFixed(2)} birr</li> {/* Display total commission */}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Profile;
