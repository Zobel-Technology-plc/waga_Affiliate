'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { FaSearch } from 'react-icons/fa';

const AdminHeader = () => {
  const { data: session, status } = useSession();
  const [dropdownVisible, setDropdownVisible] = useState(false);

  useEffect(() => {
    if (session) {
      console.log('Session data:', session);
    }
  }, [session]);

  if (status === 'loading') return <div>Loading...</div>;

  const handleDropdownToggle = () => {
    setDropdownVisible(!dropdownVisible);
  };

  return (
    <header className="flex justify-between items-center px-4 sm:px-6 py-3 bg-white shadow-md relative">
      {/* Logo and Title */}
      <div className="flex items-center text-xl sm:text-3xl font-bold">
        <Image src="/images/Waga.png" alt="Logo" width={48} height={48} className="mr-2" />
        <h1 className="ml-2">Waga Admin</h1>
      </div>

      {/* Search Bar (Hidden on small screens) */}
      <div className="hidden sm:flex items-center bg-gray-100 rounded-full px-3 py-1 w-full sm:w-1/3 justify-center mx-4">
        <FaSearch className="text-gray-500 mr-2" />
        <input
          type="text"
          placeholder="Search"
          className="bg-transparent outline-none w-full"
        />
      </div>

      {/* Icons and User Profile */}
      <div className="flex items-center space-x-3 sm:space-x-4 ml-auto text-xl sm:text-2xl">
        {/* User Profile Dropdown */}
        {session && session.user && (
          <div className="relative">
            <div
              className="flex items-center cursor-pointer"
              onClick={handleDropdownToggle}
            >
              <Image
                src={session.user.image || '/images/default_avatar.png'}
                alt="User Avatar"
                width={48}
                height={48}
                className="rounded-full"
              />
              <span className="hidden sm:block text-gray-700 ml-2">{session.user.username}</span>
            </div>

            {/* Dropdown Menu */}
            {dropdownVisible && (
              <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg py-2 z-50">
                <button
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => console.log('Navigate to Settings')}
                >
                  Settings
                </button>
                <button
                  className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => signOut()}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default AdminHeader;
