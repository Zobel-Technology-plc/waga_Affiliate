/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import { useRouter } from 'next/navigation';
import './Profile.css';

const Profile = () => {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [points, setPoints] = useState(0);
  const [commission, setCommission] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [city, setCity] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [requestingSeller, setRequestingSeller] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && WebApp.initDataUnsafe?.user) {
      setUserData(WebApp.initDataUnsafe.user);
    }
  }, []);

  useEffect(() => {
    if (userData) {
      const fetchUserProfile = async () => {
        try {
          const response = await fetch(`/api/user/${userData.id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch user profile');
          }
          const data = await response.json();
          console.log('User profile data:', data); // Debugging log

          setPoints(data.data.points || 0);
          setCommission(data.data.commission || 0);
          setPhoneNumber(data.data.phoneNumber || '');
          setCity(data.data.City || '');
          setRole(data.data.role?.toLowerCase() || ''); // Normalize and set role
          setStatus(data.data.status || '');
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      };

      fetchUserProfile();
    }
  }, [userData]);

  const handleRequestSeller = async () => {
    if (!userData) return;
    setRequestingSeller(true);
    try {
      const response = await fetch(`/api/user/request-seller`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.id }),
      });

      const result = await response.json();
      if (result.success) {
        alert('Request to become a seller submitted successfully!');
        setStatus('pending');
      } else {
        alert(result.message || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Error requesting seller role:', error);
    } finally {
      setRequestingSeller(false);
    }
  };

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

  const handleMyProductsClick = () => {
    router.push(`/sellerproduct`);
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

          {role === 'seller' && (
            <button className="my-products-button" onClick={handleMyProductsClick}>
              My Products
            </button>
          )}
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

        {role === 'seller' ? (
          <button className="upload-button" onClick={handleUploadProductsClick}>
            Upload Products
          </button>
        ) : (
          <button
            className="seller-request-button mb-4"
            onClick={handleRequestSeller}
            disabled={status === 'pending' || requestingSeller}
          >
            {status === 'pending' ? 'Request Pending' : 'Request to be a Seller'}
          </button>
        )}

        <button className="withdraw-button mt-4" onClick={handleWithdrawClick}>
          Withdraw
        </button>
      </div>
    </div>
  );
};

export default Profile;
