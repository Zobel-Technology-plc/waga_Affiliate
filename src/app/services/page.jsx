'use client'
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import WebApp from '@twa-dev/sdk';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && WebApp.initDataUnsafe.user) {
      setUserId(WebApp.initDataUnsafe.user.id);
    }
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get('/api/services');
        if (response.data.success) {
          setServices(response.data.data);
        } else {
          console.error('Failed to fetch service:', response.data.message);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {/* Navigation Bar */}
      <nav className="bg-gray-800 p-4 mt-2">
        <ul className="flex space-x-4">
          <li>
            <Link href="/" className="text-white hover:text-gray-300 m-5 ">
            Categories
            </Link>
          </li>
          <li>
            <Link href="/product" className="text-white hover:text-gray-300 m-5 ">
              Products
            </Link>
          </li>
          <li>
            <Link href="/services" className="text-white hover:text-gray-300 ml-9">
              Services
            </Link>
          </li>
        </ul>
      </nav>

      {/* Services List */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
        {services.map((service) => (
          <div key={service._id} className="bg-white shadow-md rounded-md p-4">
            <Link href={`/serviceorder?serviceId=${service._id}&serviceImage=${encodeURIComponent(service.image)}&serviceName=${encodeURIComponent(service.name)}&userId=${userId}`}>
                <div className="relative w-full h-60">
                  <Image
                    src={service.image}
                    alt={service.name}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-md"
                  />
                </div>
            </Link>

            <h3 className="text-lg font-bold mt-4">{service.name}</h3>
            <p className="text-gray-600">Starting at {new Intl.NumberFormat().format(service.startingPrice)} birr</p>
            <p className="text-gray-600">Commission: {new Intl.NumberFormat().format(service.commission)}%</p> {/* Display 10% commission */}
            <p className="text-gray-600">Points: {new Intl.NumberFormat().format(service.point)}</p>
          </div>
        ))}
      </div>
    </>
  );
};

export default Services;
