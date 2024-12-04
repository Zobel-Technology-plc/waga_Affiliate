'use client';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import React, { useState, useEffect } from 'react';
import { FaAngleDown, FaAngleUp } from 'react-icons/fa';

const SideNav = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('');
  const [showOrderLinks, setShowOrderLinks] = useState(false);
  const [showserviceLinks, setShowserviceLinks] = useState(false);

  useEffect(() => {
    if (pathname) {
      if (pathname.startsWith('/admin/user')) {
        setActiveTab('users');
      } else if (pathname.startsWith('/admin/orderlist') || pathname.startsWith('/admin/serviceorderlist')) {
        setActiveTab('orders');
        setShowOrderLinks(true);
      } else if (pathname.startsWith('/admin/product')) {
        setActiveTab('products');
        setShowserviceLinks(true);
      } else if (pathname.startsWith('/admin/serviceorderlist')) {
        setActiveTab('serviceorderlist');
      } else if (pathname.startsWith('/admin/orderlist')) {
        setActiveTab('orderlist');
      } else if (pathname.startsWith('/admin/category')) {
        setActiveTab('categories');
      } else if (pathname.startsWith('/admin/subcategory')) {
        setActiveTab('subcategories');
      }else if (pathname.startsWith('/admin/productApproval')) {
        setActiveTab('productApproval');
        setShowOrderLinks(false); // Ensure unrelated menus collapse
         setShowServiceLinks(false);
      } else if (pathname.startsWith('/admin/PendingPoint')) {
        setActiveTab('conversions');
      } else if (pathname.startsWith('/admin/converted')) {
        setActiveTab('converted');
      } else if (pathname.startsWith('/admin/complete')) {
        setActiveTab('complete');
      } else if (pathname.startsWith('/admin/earn')) {
        setActiveTab('earn');
      }else if (pathname.startsWith('/admin/canceled')) {
        setActiveTab('cancel');
      } else {
        setActiveTab('dashboard');
      }
    }
  }, [pathname]);

  return (
    <nav className="w-64 bg-white text-gray-800 p-5 h-full fixed shadow-md overflow-y-auto">
      <ul className="space-y-2 pb-20">
        <li
          className={`p-2 cursor-pointer ${activeTab === 'dashboard' ? 'bg-gray-200' : ''}`}
          onClick={() => {
            setActiveTab('dashboard');
            router.push('/admin');
          }}
        >
          Dashboard
        </li>

        <li
          className={`p-2 cursor-pointer ${activeTab === 'users' ? 'bg-gray-200' : ''}`}
          onClick={() => {
            setActiveTab('users');
            router.push('/admin/user');
          }}
        >
          Users
        </li>

        <li className="p-2 cursor-pointer flex justify-between items-center" onClick={() => setShowOrderLinks(!showOrderLinks)}>
          <span>Orders</span>
          {showOrderLinks ? <FaAngleUp /> : <FaAngleDown />}
        </li>

        {showOrderLinks && (
          <ul className="pl-4 space-y-2">
            <li
              className={`p-2 cursor-pointer ${activeTab === 'orderlist' ? 'bg-gray-200' : ''}`}
              onClick={() => {
                setActiveTab('orderlist');
                router.push('/admin/orderlist');
              }}
            >
              Product Orders
            </li>

            <li
              className={`p-2 cursor-pointer ${activeTab === 'serviceorderlist' ? 'bg-gray-200' : ''}`}
              onClick={() => {
                setActiveTab('serviceorderlist');
                router.push('/admin/serviceorderlist');
              }}
            >
              Service Orders
            </li>
          </ul>
        )}

        <li className="p-2 cursor-pointer flex justify-between items-center" onClick={() => setShowserviceLinks(!showserviceLinks)}>
          <span>Item</span>
          {showserviceLinks ? <FaAngleUp /> : <FaAngleDown />}
        </li>

        {showserviceLinks && (
          <ul className="pl-4 space-y-2">
            <li
              className={`p-2 cursor-pointer ${activeTab === 'products' ? 'bg-gray-200' : ''}`}
              onClick={() => {
                setActiveTab('products');
                router.push('/admin/product');
              }}
            >
              Product
            </li>

            <li
              className={`p-2 cursor-pointer ${activeTab === 'service' ? 'bg-gray-200' : ''}`}
              onClick={() => {
                setActiveTab('service');
                router.push('/admin/service');
              }}
            >
              Service
            </li>
          </ul>
        )}

        <li
          className={`p-2 cursor-pointer ${activeTab === 'categories' ? 'bg-gray-200' : ''}`}
          onClick={() => {
            setActiveTab('categories');
            router.push('/admin/category');
          }}
        >
          Categories
        </li>

        <li
          className={`p-2 cursor-pointer ${activeTab === 'subcategories' ? 'bg-gray-200' : ''}`}
          onClick={() => {
            setActiveTab('subcategories');
            router.push('/admin/subcategory');
          }}
        >
          Subcategories
        </li>

        <li
          className={`p-2 cursor-pointer ${activeTab === 'conversions' ? 'bg-gray-200' : ''}`}
          onClick={() => {
            setActiveTab('conversions');
            router.push('/admin/PendingPoint');
          }}
        >
          Conversions
        </li>

        <li
          className={`p-2 cursor-pointer ${activeTab === 'converted' ? 'bg-gray-200' : ''}`}
          onClick={() => {
            setActiveTab('converted');
            router.push('/admin/converted');
          }}
        >
          Converted
        </li>

        <li
          className={`p-2 cursor-pointer ${activeTab === 'productApproval' ? 'bg-gray-200' : ''}`}
          onClick={() => {
            setActiveTab('productApproval');
            router.push('/admin/productApproval');
          }}
        >
          Product Approval
        </li>

        <li
          className={`p-2 cursor-pointer ${activeTab === 'complete' ? 'bg-gray-200' : ''}`}
          onClick={() => {
            setActiveTab('complete');
            router.push('/admin/complete');
          }}
        >
          Completed Orders
        </li>

        <li
          className={`p-2 cursor-pointer ${activeTab === 'cancel' ? 'bg-gray-200' : ''}`}
          onClick={() => {
            setActiveTab('cancel');
            router.push('/admin/canceled');
          }}
        >
          Canceled Orders
        </li>

        <li
          className={`p-2 mb-4 cursor-pointer ${activeTab === 'earn' ? 'bg-gray-200' : ''}`}
          onClick={() => {
            setActiveTab('earn');
            router.push('/admin/earn');
          }}
        >
          Earned
        </li>

        <li className="p-2 mt-8 cursor-pointer" onClick={() => signOut({ callbackUrl: '/login' })}>
          Logout
        </li>
      </ul>
    </nav>
  );
};

export default SideNav;
