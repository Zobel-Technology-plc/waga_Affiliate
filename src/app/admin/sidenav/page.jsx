'use client';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import React, { useState, useEffect } from 'react';
import { FaAngleDown, FaAngleUp } from 'react-icons/fa'; // For the arrow icons

const SideNav = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('');
  const [showOrderLinks, setShowOrderLinks] = useState(false);

  useEffect(() => {
    if (pathname) {
      if (pathname.startsWith('/admin/user')) {
        setActiveTab('users');
      } else if (pathname.startsWith('/admin/orderlist') || pathname.startsWith('/admin/serviceorderlist')) {
        setActiveTab('orders');
        setShowOrderLinks(true);
      } else if (pathname.startsWith('/admin/product')) {
        setActiveTab('products');
      } else if (pathname.startsWith('/admin/category')) {
        setActiveTab('categories');
      } else if (pathname.startsWith('/admin/subcategory')) {
        setActiveTab('subcategories');
      } else {
        setActiveTab('dashboard');
      }
    }
  }, [pathname]);

  return (
    <nav className="w-64 bg-white text-gray-800 p-5 h-full fixed shadow-md">
      <ul>
        <li
          className={`p-2 mb-4 cursor-pointer ${activeTab === 'dashboard' ? 'bg-gray-200' : ''}`}
          onClick={() => {
            setActiveTab('dashboard');
            router.push('/admin');
          }}
        >
          Dashboard
        </li>

        <li
          className={`p-2 mb-4 cursor-pointer ${activeTab === 'users' ? 'bg-gray-200' : ''}`}
          onClick={() => {
            setActiveTab('users');
            router.push('/admin/user');
          }}
        >
          Users
        </li>

        <li className="p-2 mb-4 cursor-pointer flex justify-between items-center" onClick={() => setShowOrderLinks(!showOrderLinks)}>
          <span>Orders</span>
          {showOrderLinks ? <FaAngleUp /> : <FaAngleDown />} {/* Toggle arrow based on state */}
        </li>

        {showOrderLinks && (
          <ul className="pl-4 mb-4">
            <li
              className={`p-2 cursor-pointer mb-2 ${activeTab === 'orders' ? 'bg-gray-200' : ''}`}
              onClick={() => {
                setActiveTab('orders');
                router.push('/admin/orderlist');
              }}
            >
              Product Orders
            </li>

            <li
              className={`p-2 cursor-pointer ${activeTab === 'orders' ? 'bg-gray-200' : ''}`}
              onClick={() => {
                setActiveTab('orders');
                router.push('/admin/serviceorderlist');
              }}
            >
              Service Orders
            </li>
          </ul>
        )}

        {/* Added Products, Categories, and Subcategories */}
        <li
          className={`p-2 mb-4 cursor-pointer ${activeTab === 'products' ? 'bg-gray-200' : ''}`}
          onClick={() => {
            setActiveTab('products');
            router.push('/admin/product');
          }}
        >
          Products
        </li>

        <li
          className={`p-2 mb-4 cursor-pointer ${activeTab === 'categories' ? 'bg-gray-200' : ''}`}
          onClick={() => {
            setActiveTab('categories');
            router.push('/admin/category');
          }}
        >
          Categories
        </li>

        <li
          className={`p-2 mb-4 cursor-pointer ${activeTab === 'subcategories' ? 'bg-gray-200' : ''}`}
          onClick={() => {
            setActiveTab('subcategories');
            router.push('/admin/subcategory');
          }}
        >
          Subcategories
        </li>

        <li className="p-2 mt-8 cursor-pointer" onClick={() => signOut({ callbackUrl: '/login' })}>
          Logout
        </li>
      </ul>
    </nav>
  );
};

export default SideNav;
