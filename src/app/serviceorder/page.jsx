"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import WebApp from '@twa-dev/sdk';

const ServiceOrder = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serviceId, setServiceId] = useState('');
  const [serviceImage, setServiceImage] = useState('');
  const [city, setCity] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userId, setUserId] = useState(null);
  const [orderFor, setOrderFor] = useState('self');  // New state for order type (self/other)

  useEffect(() => {
    if (typeof window !== 'undefined' && WebApp.initDataUnsafe.user) {
      setUserId(WebApp.initDataUnsafe.user.id);
    }
  }, []);

  useEffect(() => {
    const serviceIdParam = searchParams.get('serviceId');
    const serviceImageParam = searchParams.get('serviceImage');
    const userIdParam = searchParams.get('userId');
    if (serviceIdParam) {
      setServiceId(serviceIdParam);
    }
    if (serviceImageParam) {
      setServiceImage(decodeURIComponent(serviceImageParam));
    }
    if (userIdParam) {
      setUserId(userIdParam);
    }
  }, [searchParams]);

  const handleOrder = async () => {
    try {
      if (!userId) {
        console.error("User ID is not available. Cannot place order.");
        return;
      }

      const orderDetails = {
        userId,
        serviceId,
        city: orderFor === 'other' ? city : '',  // Include city only if 'other'
        phoneNumber: orderFor === 'other' ? phoneNumber : '',  // Include phone only if 'other'
        orderFor,  // Include orderFor in the payload
        status: "pending",  // Default status
      };

      console.log("Order Details:", orderDetails);

      const response = await fetch("/api/services/serviceorder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderDetails),
      });

      if (response.ok) {
        console.log("Order created successfully");

        // Reward 10,000 points after a successful order
        await fetch("/api/points", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            points: 10000, // Reward 10,000 points
          }),
        });

        router.push('/order-confirmed');
      } else {
        console.error("Failed to create order:", response.statusText);
        const errorData = await response.json();
        console.error("Error details:", errorData);
      }
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };

  return (
    <div className="p-4">
    {/* Back Button using PNG image */}
    <div className="mb-4 cursor-pointer" onClick={() => router.push('/services')}>
        <Image
          src="/assets/icons/back.png"  // Path to the back button image
          alt="Back to Services"
          width={30}  // Set desired width
          height={30}  // Set desired height
          className="hover:opacity-80"  // Optional hover effect
        />
    </div> 

      <h1 className="text-2xl font-bold mb-4">Place Your Service Order</h1>
      {serviceImage && (
        <div className="relative w-full h-60 mb-4">
          <Image
            src={serviceImage}
            alt="Service Image"
            layout="fill"
            objectFit="cover"
            className="rounded-md"
          />
        </div>
      )}

      {/* Radio buttons for order type */}
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Order For:</label>
        <div className="flex items-center mb-2">
          <input
            type="radio"
            id="self"
            value="self"
            checked={orderFor === 'self'}
            onChange={(e) => setOrderFor(e.target.value)}
            className="mr-2"  // Add some margin between the radio button and label
          />
          <label htmlFor="self" className="mr-4">For Self</label>
          <input
            type="radio"
            id="other"
            value="other"
            checked={orderFor === 'other'}
            onChange={(e) => setOrderFor(e.target.value)}
            className="mr-2"  // Add some margin between the radio button and label
          />
          <label htmlFor="other">For Others</label>
        </div>
      </div>

      {/* Conditionally render city and phone number input fields if orderFor is 'other' */}
      {orderFor === 'other' && (
        <>
          <div className="mb-4">
            <label className="block text-gray-700">Address</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Phone Number</label>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
        </>
      )}

      <div className="flex justify-center mb-10">
        <button
          onClick={handleOrder}
          className="bg-blue-500 text-white p-2 rounded-md"
        >
          Place Order
        </button>
      </div>
    </div>
  );
};

// Wrap the entire ServiceOrder component in a Suspense boundary
export default function ServiceOrderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ServiceOrder />
    </Suspense>
  );
}
